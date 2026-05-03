<?php
require_once '../../vendor/autoload.php';

use Schwi\Database\DatabaseConnection;

try {
    // Database is ready to use via DatabaseConnection
    $result = DatabaseConnection::getOne("SELECT 1 FROM dual");
    echo "Connected to Oracle database successfully!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
