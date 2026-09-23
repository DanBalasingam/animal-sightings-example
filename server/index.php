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

/*
examples:
    note the examples use curl, which is a command typed in the terminal (javascript has its own)

   if
        curl -X GET "http://localhost:8000/api/v1/health"
   then
        $method_path='GET /api/v1/health'

   if
        curl -X GET "http://localhost:8000/api/v1/users?max=4&name=Joe"
   then
        $method_path='GET /api/v1/users'

   if
        curl -X GET "http://localhost:8000/api/v1/users"
   then
        $method_path='GET /api/v1/users'
*/
$method_path = $_SERVER['REQUEST_METHOD'] . ' ' . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

/*
example
    Note: please use query parameters only as it simplifies life for us all
    $method_path = 'GET /api/v1/health?q=hello'
                                      ^^^^^^^^ the q=... is the query parameter

query_params is stored as an associative array:
    [
        'q' => 'hello'
    ]

can be accessed like this:
    $query_params['q'] would be read by PHP as 'hello'
                   ^ key                        ^ value
*/
$query_params = [];
parse_str(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY) ?? '',
    $query_params
);

try {
    switch ($method_path) {
        // HTTP crash course:
        // - https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
        //
        //   basics of HTTP:
        //   - GET: retrieve data
        //   - POST: create data
        //   - PUT: update data
        //   - DELETE: delete data
        //
        //   then the path:
        //   - /api/v1/{rest/of/path} where api/v1 is so that we can have multiple versions
        //     of the API if things change in the future (just good practice)
        case 'GET /api/v1/health':
        {
            /*
            example:
               {
                "status": "ok"
               }
            */
            response([
                'status' => 'ok'
            ]);
        }

        case 'POST /api/v1/register':
        {
            $data     = body();
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

            /*
            example:
               [
                  {
                    "id": 1,
                    "email": "tesst-user@example.com",
                    "name": "Joe Public",
                    "password_hash": "$2a$12$d6AxyJkK5mbLKNp1CQ8QOeGL1I3ZImcIj0RkxxWoQmyE4dWOjx.SG",
                    "created_at": "2026-09-11 03:47:04",
                    "updated_at": "2026-09-11 03:47:04"
                  },
                  {
                    "id": 2,
                    "email": "marco@chef.com",
                    "name": "Marco Pierre White",
                    "password_hash": "$2a$12$42BGezY/6tVr5/Q2.rL6mOBQllWKWGR5TD1.ssQMbqWI6l7ebuMXa",
                    "created_at": "2023-06-01T07:38:00",
                    "updated_at": "2023-06-01T07:38:00"
                  },
                ...
               ]
            */
            response($users);
        }

        case 'POST /api/v1/users':
        {
            $data = body();

            $name = $data['name'];
            $email = $data['email'];
            $password = $data['password'];

            // Check if email already exists
            $stmt = db()->prepare(
                'SELECT 1 FROM user WHERE email = :email LIMIT 1'
            );
            $stmt->execute(['email' => $email]);

            if ($stmt->fetchColumn() !== false) {
                response([
                    'error' => 'Email already exists'
                ], 400);
                return;
            }

            $password_hash = password_hash($password, PASSWORD_BCRYPT);
            $created_at = date('Y-m-d H:i:s');
            $updated_at = $created_at;

            $stmt = db()->prepare(
                'INSERT INTO user
                (name, email, password_hash, created_at, updated_at)
                VALUES
                (?, ?, ?, ?, ?)'
            );

            $stmt->execute([
                $name,
                $email,
                $password_hash,
                $created_at,
                $updated_at,
            ]);

            /*
            example 1:
            {
                "id":8
            }

            example 2:
            {
                "error": "Email already exists"
            }
            */
            response([
                'id' => db()->lastInsertId()
            ], 201);
        }

        default:
            /*
            example:

            {
                "error": "Not found"
            }
            */
            response([
                'error' => "Not found"
            ], 404);
        }
    } catch (PDOException $e) {
    /*
    example:
        {
            "error": "SQLSTATE[23000]: Integrity constraint violation: 19 UNIQUE constraint failed: user.email"
        }
    */
    response([
        'error' => $e->getMessage()
    ], 500);

    // also show the error message in the PHP console
    echo $e->getMessage();
}
