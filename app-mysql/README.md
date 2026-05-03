# MySQL Docker Container

A PHP/Nginx application container with MySQL 8.0 database and the Schwi Database component for simplified database operations.

## 📋 Structure

```
app-mysql/
├── docker-compose.yml       # Container orchestration
├── docker/
│   ├── nginx/
│   │   └── default.conf     # Nginx web server config
│   └── php/
│       └── Dockerfile       # PHP 8.2-FPM with MySQL PDO
├── src/
│   ├── app/
│   │   └── index.php        # Application entry point
│   └── public/
│       ├── index.php        # Public PHP file
│       └── test-connection.php  # DB connection test
├── vendor/                  # Composer dependencies
├── composer.json            # PHP dependencies
├── .env                     # Environment variables
├── .env.example             # Example environment config
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Optional: MySQL client for direct database access

### Starting the Container

```bash
# Navigate to the container directory
cd app-mysql

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### Access the Application

- **Web Interface**: http://localhost:8080
- **MySQL Port**: localhost:3306
- **Connection Test**: http://localhost:8080/test-connection.php

### Stopping the Container

```bash
docker-compose down
```

## ⚙️ Configuration

Edit the `.env` file to customize database settings:

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=rootpass123     # Root user password
MYSQL_DATABASE=appdb                # Default database name
MYSQL_USER=appuser                  # Application user
MYSQL_PASSWORD=apppass123           # Application user password

# PHP/Database Component Configuration
DB_TYPE=mysql                       # Database type
DB_HOST=db                          # Database host (Docker service name)
DB_PORT=3306                        # MySQL port
DB_CHARSET=utf8mb4                  # Character set
```

## 🔧 Services

| Service | Image | Port | Container Name |
|---------|-------|------|----------------|
| **Web Server** | nginx:alpine | 8080 | myapp-nginx-mysql |
| **PHP Application** | php:8.2-fpm-bullseye | 9000 | myapp-php-mysql |
| **Database** | mysql:8.0 | 3306 | myapp-mysql |

## 💾 Database Component Usage

The Schwi Database component is included for easy database operations:

### Simple Queries

```php
<?php
use Schwi\Database\DatabaseConnection;

// Fetch single value
$count = DatabaseConnection::getOne("SELECT COUNT(*) FROM users");

// Fetch single row
$user = DatabaseConnection::getRow("SELECT * FROM users WHERE id = ?", [1]);

// Fetch all rows
$users = DatabaseConnection::getAll("SELECT * FROM users");
```

### Insert/Update/Delete

```php
<?php
use Schwi\Database\DatabaseConnection;

DatabaseConnection::execute(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    ['John Doe', 'john@example.com']
);
```

### Transactions

```php
<?php
use Schwi\Database\DatabaseConnection;

try {
    DatabaseConnection::beginTransaction();
    // ... execute queries ...
    DatabaseConnection::commit();
} catch (Exception $e) {
    DatabaseConnection::rollback();
}
```

## 📝 Testing the Connection

Visit http://localhost:8080/test-connection.php to:
- Verify database connectivity
- Display database version
- Test basic queries

## 📦 Docker Compose Services

### nginx Service
- Reverse proxy and web server
- Listens on port 8080
- Routes requests to PHP-FPM
- Serves static files directly

### php Service  
- PHP 8.2 with FPM (FastCGI Process Manager)
- Pre-installed extensions: PDO, PDO MySQL, Composer
- Mounts source code from `./src`
- Connects to MySQL database

### db Service
- MySQL 8.0 database
- Automatic initialization with MYSQL_DATABASE
- Data persisted in Docker volume `mysql_data`
- Accessible at localhost:3306

## 🔐 Security Notes

- Update default passwords in `.env` for production use
- Database credentials are stored in environment variables
- Consider using `.env.example` as a template without storing secrets
- Use strong passwords for `MYSQL_ROOT_PASSWORD` and `MYSQL_PASSWORD`

## 📚 Common Commands

```bash
# View container logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f php
docker-compose logs -f db

# Execute PHP command inside container
docker-compose exec php php -v

# Connect to MySQL directly
docker-compose exec db mysql -uroot -p -e "SHOW DATABASES;"

# Access PHP shell
docker-compose exec php bash

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🔄 Data Persistence

- MySQL data is stored in a Docker volume named `mysql_data`
- Volume persists even after containers are stopped
- To remove all data: `docker-compose down -v`
- To backup: `docker-compose exec db mysqldump -uroot -p --all-databases > backup.sql`

## 📖 More Information

For more details about the database component, see the main [../README.md](../README.md)
