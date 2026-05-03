<?php
require_once '../../vendor/autoload.php';

use Schwi\Database\DatabaseConnection;

try {
    // Database is ready to use via DatabaseConnection
    $result = DatabaseConnection::getOne("SELECT 1");
    echo "Connected to PostgreSQL database successfully!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
