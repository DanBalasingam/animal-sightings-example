<?php

require_once 'db.php';

// GET /api/v1/images/{filename} streams a sighting image. Handled before the session starts so the
// response carries no cookie and can be cached, and because the switch below only matches exact paths
$image_path = $_SERVER['REQUEST_METHOD'] . ' ' . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('#^GET /api/v1/images/([a-z0-9_]+\.(?:jpe?g|png|webp))$#', $image_path, $m)) {
    $path = __DIR__ . '/data/image/' . $m[1];
    if (!is_file($path)) response(['error' => 'Not found'], 404);
    header('Content-Type: ' . (new finfo(FILEINFO_MIME_TYPE))->file($path));
    header('Content-Length: ' . filesize($path));
    // Filenames get a random suffix on upload and are never overwritten, so they can be cached forever
    header('Cache-Control: public, max-age=31536000, immutable');
    readfile($path);
    exit;
}

session_name('sid');
session_set_cookie_params([
    'lifetime' => 36000,
    'path'     => '/',
    'secure'   => !empty($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();
header('Content-Type: application/json');

function response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function body() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// Validates the editable sighting fields shared by create and update, responding with an error if any are bad
function sighting_input(array $data): array {
    $species_id = filter_var($data['species_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $location_id = filter_var($data['location_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $individual_count = filter_var($data['individual_count'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $notes = trim($data['notes'] ?? '');
    $timestamp = strtotime(trim($data['datetime'] ?? ''));
    if ($species_id === false || $location_id === false || $individual_count === false || $timestamp === false) {
        response(['error' => 'Invalid input'], 422);
    }

    $stmt = db()->prepare('SELECT common_name FROM species WHERE id = ?');
    $stmt->execute([$species_id]);
    $common_name = $stmt->fetchColumn();
    if (!$common_name) response(['error' => 'Unknown species'], 422);

    $stmt = db()->prepare('SELECT 1 FROM location WHERE id = ?');
    $stmt->execute([$location_id]);
    if (!$stmt->fetchColumn()) response(['error' => 'Unknown location'], 422);

    return [
        'species_id' => $species_id,
        'location_id' => $location_id,
        'individual_count' => $individual_count,
        'notes' => $notes === '' ? null : $notes,
        'datetime' => gmdate('Y-m-d\TH:i:s', $timestamp),
        'common_name' => $common_name,
    ];
}

function current_user(): ?array {
    if (!isset($_SESSION['uid'])) return null;
    $s = db()->prepare('SELECT id, email, name, created_at FROM "user" WHERE id = ?');
    $s->execute([$_SESSION['uid']]);
    return $s->fetch() ?: null;
}

$method_path = $_SERVER['REQUEST_METHOD'] . ' ' . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$query_params = [];
parse_str(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY) ?? '',
    $query_params
);

// Routes with an id in the path are matched here and given a {id} placeholder for the switch below
$route_id = null;
if (preg_match('#^(PUT|DELETE) /api/v1/sightings/(\d+)$#', $method_path, $m)) {
    $method_path = $m[1] . ' /api/v1/sightings/{id}';
    $route_id = (int) $m[2];
}

try {
    switch ($method_path) {
        case 'GET /api/v1/health':
        {
            response([
                'status' => 'ok'
            ]);
        }

        case 'POST /api/v1/register':
        {
            $data = body();
            $email = strtolower(trim($data['email'] ?? ''));
            $name = trim($data['name'] ?? '');
            $pw = $data['password'] ?? '';
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $name === '' || strlen($pw) < 8) {
                response(['error' => 'Invalid input'], 422);
            }
            $now = gmdate('Y-m-d H:i:s');
            try {
                db()->prepare('INSERT INTO "user" (email, name, password_hash, created_at, updated_at)
                               VALUES (?, ?, ?, ?, ?)')
                    ->execute([$email, $name, password_hash($pw, PASSWORD_BCRYPT), $now, $now]);
            } catch (PDOException $e) {
                if ($e->getCode() === '23000') response(['error' => 'Email already registered'], 409);
                throw $e;
            }
            session_regenerate_id(true);
            $_SESSION['uid'] = (int) db()->lastInsertId();
            response(['user' => current_user()], 201);
        }

        case 'POST /api/v1/login':
        {
            $data = body();
            $stmt = db()->prepare('SELECT id, password_hash FROM "user" WHERE email = ?');
            $stmt->execute([strtolower(trim($data['email'] ?? ''))]);
            $row = $stmt->fetch();
            if (!$row || !password_verify($data['password'] ?? '', $row['password_hash'])) {
                response(['error' => 'Invalid email or password'], 401);
            }
            session_regenerate_id(true);
            $_SESSION['uid'] = (int) $row['id'];
            response(['user' => current_user()], 200);
        }

        case 'POST /api/v1/logout':
        {
            $_SESSION = [];
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 3600, 'path' => $params['path'], 'domain' => $params['domain'],
                'secure' => $params['secure'], 'httponly' => $params['httponly'], 'samesite' => $params['samesite'],
            ]);
            session_destroy();
            response(['ok' => true], 200);
        }

        case 'GET /api/v1/me':
        {
            $user = current_user();
            $user ? response(['user' => $user], 200) : response(['error' => 'Not authenticated'], 401);
        }

        case 'GET /api/v1/species':
        {
            $where  = [];
            $params = [];

            $search = trim($query_params['search'] ?? '');
            if ($search !== '') {
                $where[]  = '(sp.common_name LIKE ? OR sp.maori_name LIKE ? OR sp.scientific_name LIKE ?)';
                $like     = '%' . $search . '%';
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
            }

            $category = trim($query_params['category'] ?? '');
            if ($category !== '' && strtolower($category) !== 'all') {
                $where[]  = 'LOWER(sc.name) = LOWER(?)';
                $params[] = $category;
            }

            $sql = "SELECT
                    sp.id,
                    sp.common_name,
                    sp.scientific_name,
                    sp.maori_name,
                    sc.name AS species_category,
                    tc.name AS threat_category,
                    sp.population_estimate,
                    COUNT(si.species_id) AS sightings
                FROM species AS sp
                INNER JOIN species_category AS sc
                    ON sp.species_category_id = sc.id
                INNER JOIN threat_category AS tc
                    ON sp.threat_category_id = tc.id
                LEFT JOIN sighting AS si
                    ON sp.id = si.species_id";
            if ($where) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }
            $sql .= ' GROUP BY
                    sp.id,
                    sp.common_name,
                    sp.scientific_name,
                    sp.maori_name,
                    sc.name,
                    tc.name,
                    sp.population_estimate
                ORDER BY sp.common_name';

            $stmt = db()->prepare($sql);
            $stmt->execute($params);
            $species = $stmt->fetchAll();
            response($species, 200);
        }

        case 'GET /api/v1/counts':
        {
            $countSpecies = db()->query('SELECT COUNT(*) FROM "species"')->fetchColumn();
            $countSightings = db()->query('SELECT COUNT(si.id) FROM sighting AS si')->fetchColumn();
            $countUsers = db()->query('SELECT COUNT(*) FROM "user"')->fetchColumn();
            $countRegions = db()->query('SELECT COUNT(DISTINCT region) FROM location')->fetchColumn();

            $count = [
                'users_count' => $countUsers,
                'species_count' => $countSpecies,
                'sightings_count' => $countSightings,
                'region_count' => $countRegions
            ];
            response($count, 200);
        }

        case 'GET /api/v1/species/categories':
        {
            $stmt = db()->prepare('SELECT * FROM species_category');
            $stmt->execute();
            $categories = $stmt->fetchAll();
            response($categories, 200);
        }

        case 'GET /api/v1/sightings':
        {
            $where = [];
            $params = [];

            $user = $query_params['user'] ?? null;
            if ($user === 'me') {
                $me = current_user();
                if ($me === null) {
                    response(['Error' => 'User not authenticated'], 401);
                }
                $where[] = 'usr.id = ?';
                $params[] = $me['id'];
            }

            if (isset($query_params['id'])) {
                $id = filter_var($query_params['id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
                if ($id === false) response(['error' => 'Invalid id'], 422);
                $where[] = 'si.id = ?';
                $params[] = $id;
            }

            $category = trim($query_params['category'] ?? '');
            if ($category !== '' && strtolower($category) !== 'all') {
                $where[] = 'LOWER(sc.name) = LOWER(?)';
                $params[] = $category;
            }

            $region = trim($query_params['region'] ?? '');
            if ($region !== '') {
                $where[] = 'LOWER(lc.region) = LOWER(?)';
                $params[] = $region;
            }

            $place = trim($query_params['place'] ?? '');
            if ($place !== '') {
                $where[] = 'lc.name LIKE ?';
                $params[] = '%' . $place . '%';
            }
            // TODO: add terrain feature query...

            $order = trim(strtoupper($query_params['order'] ?? ''));
            if (($order === '') || (($order !== 'ASC') && ($order !== 'DESC'))) {
                $order = 'DESC';
            }

            $sql = "SELECT
                        si.id,
                        si.species_id,
                        si.sighting_location_id AS location_id,
                        si.observer_user_id AS observer_id,
                        si.individual_count AS num_seen,
                        si.notes,
                        si.sighting_datetime,
                        si.created_at,
                        sp.common_name,
                        sp.scientific_name,
                        sp.maori_name,
                        sp.population_estimate,
                        sp.year_assessed,
                        sc.name AS species_category,
                        tc.name AS threat_category,
                        lc.name AS location_name,
                        lc.latitude,
                        lc.longitude,
                        lc.region,
                        img.filename AS sighting_image,
                        usr.name AS observer_name,
                        (
                            SELECT GROUP_CONCAT(tf.name, ',')
                            FROM location_terrain_feature AS ltf
                            INNER JOIN terrain_feature AS tf
                                ON ltf.feature_id = tf.id
                            WHERE ltf.location_id = si.sighting_location_id
                        ) AS terrain_features
                    FROM sighting AS si
                    INNER JOIN species AS sp
                        ON si.species_id = sp.id
                    INNER JOIN species_category AS sc
                        ON sp.species_category_id = sc.id
                    INNER JOIN threat_category AS tc
                        ON sp.threat_category_id = tc.id
                    INNER JOIN location AS lc
                        ON si.sighting_location_id = lc.id
                    LEFT JOIN image AS img
                        ON si.sighting_image_id = img.id
                    LEFT JOIN user AS usr
                        ON si.observer_user_id = usr.id";

            if ($where) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }

            $sql .= " ORDER BY si.created_at {$order} ";
            $stmt = db()->prepare($sql);
            $stmt->execute($params);
            $sightings = $stmt->fetchAll();
            response($sightings, 200);
        }

        case 'POST /api/v1/sightings':
        {
            // Sent as multipart/form-data so a photo can be attached; PHP leaves both empty if the request is too large
            if (str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') && empty($_POST) && empty($_FILES)) {
                response(['error' => 'Upload too large'], 413);
            }
            $input = sighting_input($_POST ?: body());

            $photo = $_FILES['photo'] ?? null;
            $photo_ext = null;
            if ($photo && $photo['error'] !== UPLOAD_ERR_NO_FILE) {
                if ($photo['error'] === UPLOAD_ERR_INI_SIZE || $photo['error'] === UPLOAD_ERR_FORM_SIZE) {
                    response(['error' => 'Photo too large'], 413);
                }
                if ($photo['error'] !== UPLOAD_ERR_OK) response(['error' => 'Photo upload failed'], 400);
                $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
                $photo_ext = $types[(new finfo(FILEINFO_MIME_TYPE))->file($photo['tmp_name'])] ?? null;
                if ($photo_ext === null) response(['error' => 'Photo must be a JPEG, PNG or WebP'], 422);
            }

            $user = current_user();
            $now = gmdate('Y-m-d\TH:i:s');
            $image_id = null;
            $photo_path = null;
            db()->beginTransaction();
            try {
                if ($photo_ext !== null) {
                    // Match the existing naming - regex generated by claude.
                    $slug = trim(preg_replace('/[^a-z0-9]+/', '_', strtolower($input['common_name'])), '_');
                    $filename = $slug . '_' . bin2hex(random_bytes(3)) . '.' . $photo_ext;
                    $photo_path = __DIR__ . '/data/image/' . $filename;
                    if (!move_uploaded_file($photo['tmp_name'], $photo_path)) {
                        throw new RuntimeException('Could not save photo');
                    }
                    db()->prepare('INSERT INTO image (filename, uploaded_at) VALUES (?, ?)')
                        ->execute([$filename, gmdate('Y-m-d H:i:s')]);
                    $image_id = (int) db()->lastInsertId();
                }
                db()->prepare('INSERT INTO sighting (species_id, observer_user_id, sighting_location_id, individual_count, notes, sighting_datetime, created_at, sighting_image_id)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                    ->execute([
                        $input['species_id'],
                        $user['id'] ?? null,
                        $input['location_id'],
                        $input['individual_count'],
                        $input['notes'],
                        $input['datetime'],
                        $now,
                        $image_id,
                    ]);
                $sighting_id = (int) db()->lastInsertId();
                db()->commit();
            } catch (Throwable $e) {
                db()->rollBack();
                if ($photo_path && is_file($photo_path)) unlink($photo_path);
                if ($e instanceof PDOException) throw $e;
                response(['error' => $e->getMessage()], 500);
            }
            response(['id' => $sighting_id, 'image' => $filename ?? null], 201);
        }

        case 'PUT /api/v1/sightings/{id}':
        {
            $me = current_user();
            if ($me === null) response(['error' => 'Not authenticated'], 401);

            $stmt = db()->prepare('SELECT observer_user_id FROM sighting WHERE id = ?');
            $stmt->execute([$route_id]);
            $sighting = $stmt->fetch();
            if (!$sighting) response(['error' => 'Not found'], 404);
            if ((int) $sighting['observer_user_id'] !== (int) $me['id']) {
                response(['error' => 'You can only edit your own sightings'], 403);
            }

            $input = sighting_input(body());
            db()->prepare('UPDATE sighting
                           SET species_id = ?, sighting_location_id = ?, individual_count = ?, notes = ?, sighting_datetime = ?
                           WHERE id = ?')
                ->execute([
                    $input['species_id'],
                    $input['location_id'],
                    $input['individual_count'],
                    $input['notes'],
                    $input['datetime'],
                    $route_id,
                ]);
            response(['id' => $route_id], 200);
        }

        case 'DELETE /api/v1/sightings/{id}':
        {
            $me = current_user();
            if ($me === null) response(['error' => 'Not authenticated'], 401);

            $stmt = db()->prepare('SELECT observer_user_id, sighting_image_id FROM sighting WHERE id = ?');
            $stmt->execute([$route_id]);
            $sighting = $stmt->fetch();
            if (!$sighting) response(['error' => 'Not found'], 404);
            if ((int) $sighting['observer_user_id'] !== (int) $me['id']) {
                response(['error' => 'You can only delete your own sightings'], 403);
            }

            $image_id = $sighting['sighting_image_id'];
            $filename = null;
            db()->beginTransaction();
            try {
                db()->prepare('DELETE FROM sighting WHERE id = ?')->execute([$route_id]);
                // Images can be shared between sightings, so only remove one nothing else uses
                if ($image_id !== null) {
                    $stmt = db()->prepare('SELECT 1 FROM sighting WHERE sighting_image_id = ? LIMIT 1');
                    $stmt->execute([$image_id]);
                    if (!$stmt->fetchColumn()) {
                        $stmt = db()->prepare('SELECT filename FROM image WHERE id = ?');
                        $stmt->execute([$image_id]);
                        $filename = $stmt->fetchColumn() ?: null;
                        db()->prepare('DELETE FROM image WHERE id = ?')->execute([$image_id]);
                    }
                }
                db()->commit();
            } catch (Throwable $e) {
                db()->rollBack();
                throw $e;
            }
            // Removed after the commit so a failed delete never loses the file
            if ($filename !== null) {
                $path = __DIR__ . '/data/image/' . basename($filename);
                if (is_file($path)) unlink($path);
            }
            response(['ok' => true], 200);
        }

        case 'GET /api/v1/locations':
        {
            $stmt = db()->prepare('SELECT id, name, region FROM location');
            $stmt->execute();
            $locations = $stmt->fetchAll();
            response($locations, 200);
        }

        case 'GET /api/v1/regions':
        {
            $stmt = db()->prepare('SELECT DISTINCT region FROM location');
            $stmt->execute();
            $regions = $stmt->fetchAll();
            response($regions, 200);
        }

        case 'GET /api/v1/terrain':
        {
            $stmt = db()->prepare('SELECT * FROM terrain_feature');
            $stmt->execute();
            $terrain = $stmt->fetchAll();
            response($terrain, 200);
        }

        default:
            response([
                'error' => "Not found"
            ], 404);
        }
    } catch (PDOException $e) {

    response([
        'error' => $e->getMessage()
    ], 500);

    // also show the error message in the PHP console
    echo $e->getMessage();
}
