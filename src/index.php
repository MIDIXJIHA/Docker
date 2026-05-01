<?php
$pdo = new PDO(
    'mysql:host=db;dbname=' . getenv('MYSQL_DATABASE') . ";charset=utf8mb4",
    getenv('MYSQL_USER'),
    getenv('MYSQL_PASSWORD'),
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]
);

echo "Connected to the database successfully!";