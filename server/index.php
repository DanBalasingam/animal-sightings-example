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
            $users = db()
                ->query('SELECT * FROM user')
                ->fetchAll();
            response($users);
        }

        case 'GET /api/v1/species':
        {
            // add query params and inner join on category, and threat tables
            // select names from inner joins exclude IDs
            $stmt = db()->prepare('SELECT * FROM species ORDER BY common_name');
            $stmt->execute();
            $species = $stmt->fetchAll();
            response($species, 200);
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
