<?php

require_once 'db.php';

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
            $data  = body();
            $email = strtolower(trim($data['email'] ?? ''));
            $name  = trim($data['name'] ?? '');
            $pw    = $data['password'] ?? '';
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

        case 'GET /api/v1/users':
        {
            if (isset($query_params['count'])) {
                $count = db()->query('SELECT COUNT(*) FROM "user"')->fetchColumn();
                response(['count' => (int) $count]);
            }
            $users = db()
                ->query('SELECT * FROM user')
                ->fetchAll();
            response($users);
        }

        case 'GET /api/v1/species':
        {
            if (isset($query_params['count'])) {
                $count = db()->query('SELECT COUNT(*) FROM "species"')->fetchColumn();
                response(['count' => (int) $count]);
            }

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
                    ON sp.id = si.species_id
                GROUP BY
                    sp.id,
                    sp.common_name,
                    sp.scientific_name,
                    sp.maori_name,
                    sc.name,
                    tc.name,
                    sp.population_estimate";
            if ($where) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }
            $sql .= ' ORDER BY sp.common_name';

            $stmt = db()->prepare($sql);
            $stmt->execute($params);
            $species = $stmt->fetchAll();
            response($species, 200);
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
            response('WIP', 200);
        }

        case 'POST /api/v1/sightings':
        {
            response('WIP', 200);
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
