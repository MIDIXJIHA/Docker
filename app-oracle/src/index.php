<?php
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_port = getenv('DB_PORT') ?: '1521';
$db_name = getenv('DB_NAME') ?: 'FREEPDB1';
$db_user = getenv('DB_USER') ?: 'system';
$db_password = getenv('DB_PASSWORD') ?: 'oracle';

// Check if OCI8 extension is loaded
if (!extension_loaded('oci8')) {
    echo "<div style='padding: 20px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;'>";
    echo "<h2>⚠️  OCI8 Extension Not Loaded</h2>";
    echo "<p>The PHP OCI8 extension is required to connect to Oracle database.</p>";
    echo "<p><strong>To enable OCI8:</strong></p>";
    echo "<ol>";
    echo "<li>Download Oracle Instant Client from: <a href='https://www.oracle.com/database/technologies/instant-client/' target='_blank'>https://www.oracle.com/database/technologies/instant-client/</a></li>";
    echo "<li>Extract and place in <code>docker/instantclient_21_9/</code> folder</li>";
    echo "<li>Uncomment OCI8 installation in <code>docker/php/Dockerfile</code></li>";
    echo "<li>Rebuild: <code>docker compose build --no-cache</code></li>";
    echo "<li>Restart: <code>docker compose up -d</code></li>";
    echo "</ol>";
    echo "<p>Available PDO Drivers: " . implode(", ", PDO::getAvailableDrivers()) . "</p>";
    echo "</div>";
    exit;
}

// Oracle connection string
$conn_string = "(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = $db_host)(PORT = $db_port)) (CONNECT_DATA = (SERVER = DEDICATED) (SID = $db_name)))";

try {
    $pdo = new PDO(
        "oci:dbname=$conn_string",
        $db_user,
        $db_password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    echo "<div style='padding: 20px; background: #d4edda; border: 1px solid #28a745; border-radius: 4px;'>";
    echo "<h2>✅ Connected to Oracle database successfully!</h2>";
    
    // Test query
    $stmt = $pdo->query("SELECT * FROM v\$version WHERE ROWNUM = 1");
    if ($stmt) {
        $result = $stmt->fetch();
        if ($result) {
            echo "<p><strong>Database Version:</strong> " . htmlspecialchars($result['BANNER']) . "</p>";
        }
    }
    echo "</div>";
} catch (PDOException $e) {
    echo "<div style='padding: 20px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;'>";
    echo "<h2>❌ Connection failed</h2>";
    echo "<p><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Connection details:</strong></p>";
    echo "<ul>";
    echo "<li>Host: $db_host</li>";
    echo "<li>Port: $db_port</li>";
    echo "<li>Database: $db_name</li>";
    echo "<li>User: $db_user</li>";
    echo "</ul>";
    echo "</div>";
}
?>
