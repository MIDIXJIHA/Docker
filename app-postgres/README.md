# PostgreSQL Docker Container

A PHP/Nginx application container with PostgreSQL 15 database and the Schwi Database component for simplified database operations.

## 📋 Structure

```
app-postgres/
├── docker-compose.yml       # Container orchestration
├── docker/
│   ├── nginx/
│   │   └── default.conf     # Nginx web server config
│   └── php/
│       └── Dockerfile       # PHP 8.1-FPM with PostgreSQL PDO
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
- Optional: PostgreSQL client (psql) for direct database access

### Starting the Container

```bash
# Navigate to the container directory
cd app-postgres

# Setup environment file (if not already configured)
cp .env.example .env

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### Access the Application

- **Web Interface**: http://localhost:8081
- **PostgreSQL Port**: localhost:5432
- **Connection Test**: http://localhost:8081/test-connection.php

### Stopping the Container

```bash
docker-compose down
```

## ⚙️ Configuration

Edit the `.env` file to customize database settings:

```env
# PostgreSQL Configuration
POSTGRES_USER=admin                 # Database user
POSTGRES_PASSWORD=postgrespass123   # User password
POSTGRES_DB=testdb                  # Default database name
POSTGRES_INITDB_ARGS=               # Additional init arguments

# PHP/Database Component Configuration
DB_TYPE=postgres                    # Database type
DB_HOST=db                          # Database host (Docker service name)
DB_PORT=5432                        # PostgreSQL port
```

## 🔧 Services

| Service | Image | Port | Container Name |
|---------|-------|------|----------------|
| **Web Server** | nginx:alpine | 8081 | myapp-nginx-postgres |
| **PHP Application** | php:8.1-fpm-bullseye | 9000 | myapp-php-postgres |
| **Database** | postgres:15 | 5432 | myapp-postgres |

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
    ['Jane Doe', 'jane@example.com']
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

Visit http://localhost:8081/test-connection.php to:
- Verify database connectivity
- Display database and server information
- Test basic queries

## 📦 Docker Compose Services

### nginx Service
- Reverse proxy and web server
- Listens on port 8081 (note: different from MySQL container)
- Routes requests to PHP-FPM
- Serves static files directly

### php Service
- PHP 8.1 with FPM (FastCGI Process Manager)
- Pre-installed extensions: PDO, PDO PostgreSQL, Composer
- Mounts source code from `./src`
- Connects to PostgreSQL database

### db Service
- PostgreSQL 15 database
- Automatic database initialization
- Data persisted in Docker volume `postgres_data`
- Accessible at localhost:5432

## 🔐 Security Notes

- Update default passwords in `.env` for production use
- Database credentials are stored in environment variables
- Consider using `.env.example` as a template without storing secrets
- Use strong passwords for `POSTGRES_PASSWORD`

## 📚 Common Commands

```bash
# View container logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f php
docker-compose logs -f db

# Execute PHP command inside container
docker-compose exec php php -v

# Connect to PostgreSQL directly using psql
docker-compose exec db psql -U admin -d testdb

# List all databases
docker-compose exec db psql -U admin -l

# Access PHP shell
docker-compose exec php bash

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🔄 Data Persistence

- PostgreSQL data is stored in a Docker volume named `postgres_data`
- Volume persists even after containers are stopped
- To remove all data: `docker-compose down -v`
- To backup: `docker-compose exec db pg_dump -U admin testdb > backup.sql`

## 📖 More Information

For more details about the database component, see the main [../README.md](../README.md)
