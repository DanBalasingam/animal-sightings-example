<?php

$pdo = null;
ini_set('display_errors', '0');
error_reporting(E_ALL);
header('Content-Type: application/json');

function db(): PDO
{
    global $pdo;

    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . __DIR__ . '/data/sqlite.db');

        // return the errors as text, not HTML; so we can read them from the PHP logs
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }

    return $pdo;
}
