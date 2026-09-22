<?php

require_once 'db.php';

function response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function body() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
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
