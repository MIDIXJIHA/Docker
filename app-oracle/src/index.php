<?php
$db_host = getenv('DB_HOST');
$db_port = getenv('DB_PORT');
$db_name = getenv('DB_NAME');
$db_user = getenv('DB_USER');
$db_password = getenv('DB_PASSWORD');

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
    
    echo "Connected to Oracle database successfully!<br>";
    
    // Test query
    $stmt = $pdo->query("SELECT * FROM v\$version WHERE banner LIKE '%Oracle%' FETCH FIRST 1 ROWS ONLY");
    if ($stmt) {
        $result = $stmt->fetch();
        if ($result) {
            echo "Database Version: " . htmlspecialchars($result['BANNER']);
        }
    }
} catch (PDOException $e) {
    echo "Connection failed: " . htmlspecialchars($e->getMessage());
}
?>
