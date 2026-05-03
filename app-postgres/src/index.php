<?php
// PostgreSQL Connection Test

$host = 'db';
$dbname = getenv('POSTGRES_DB');
$user = getenv('POSTGRES_USER');
$password = getenv('POSTGRES_PASSWORD');
$port = '5432';

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>PostgreSQL Connection Test</h1>";
    echo "<p style='color: green;'><strong>✓ Successfully connected to PostgreSQL database!</strong></p>";
    
    // Display connection info
    echo "<div style='background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px;'>";
    echo "<p><strong>Connection Details:</strong></p>";
    echo "<ul>";
    echo "<li>Host: $host</li>";
    echo "<li>Database: $dbname</li>";
    echo "<li>User: $user</li>";
    echo "<li>Port: $port</li>";
    echo "</ul>";
    echo "</div>";
    
    // Test query
    $result = $pdo->query("SELECT version();");
    $version = $result->fetch(PDO::FETCH_ASSOC);
    echo "<div style='background: #e8f5e9; padding: 10px; margin: 10px 0; border-radius: 5px;'>";
    echo "<p><strong>PostgreSQL Version:</strong></p>";
    echo "<p>" . htmlspecialchars($version['version']) . "</p>";
    echo "</div>";
    
} catch (PDOException $e) {
    echo "<h1>PostgreSQL Connection Test</h1>";
    echo "<p style='color: red;'><strong>✗ Connection Failed!</strong></p>";
    echo "<p>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>PostgreSQL Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #333;
        }
    </style>
</head>
<body>
</body>
</html>
