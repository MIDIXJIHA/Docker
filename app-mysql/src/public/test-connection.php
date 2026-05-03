<?php
/**
 * Database Connection Test Script
 * 
 * Run this from within the container to verify database connectivity:
 * docker-compose exec php php test-connection.php
 */

require_once '../../vendor/autoload.php';

use Schwi\Database\DatabaseConnection;

echo "========================================\n";
echo "Database Connection Test\n";
echo "========================================\n\n";

// Get environment variables
$dbType = getenv('DB_TYPE') ?: 'mysql';
$dbHost = getenv('DB_HOST') ?: 'db';
$dbPort = getenv('DB_PORT') ?: 'unknown';

echo "Configuration:\n";
echo "  Database Type: " . $dbType . "\n";
echo "  Host: " . $dbHost . "\n";
echo "  Port: " . $dbPort . "\n\n";

// Test connection
try {
    echo "Attempting to connect...\n";
    
    // Test basic query
    echo "Testing query execution...\n";
    $result = DatabaseConnection::getOne("SELECT 1");
    echo "✓ Query result: " . $result . "\n\n";
    
    echo "========================================\n";
    echo "✅ All tests passed!\n";
    echo "========================================\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "========================================\n";
    exit(1);
}