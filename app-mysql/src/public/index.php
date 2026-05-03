<?php
require_once '../../vendor/autoload.php';

use Schwi\Database\DatabaseConnection;

try {
    // Database is ready to use via DatabaseConnection
    $userCount = DatabaseConnection::getOne("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()");
    echo "Connected to MySQL database successfully! Tables found: " . ($userCount ?: 0);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}