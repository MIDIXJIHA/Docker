# Oracle Docker Container

A PHP/Nginx application container with Oracle Database Free and the Schwi Database component for simplified database operations.

## ⚠️ Prerequisites

Oracle Database Free requires specific hardware and licensing conditions:
- **Must run on Linux** (not macOS or Windows natively)
- **Minimum 4GB RAM allocated to Docker**
- **20GB+ free disk space** for database files
- **Docker must support Linux containers** (not Docker Desktop on Mac by default)

For macOS users, consider using MySQL or PostgreSQL containers instead, or run this container on a Linux machine/VM.

## 📋 Structure

```
app-oracle/
├── docker-compose.yml       # Container orchestration
├── docker/
│   ├── nginx/
│   │   └── default.conf     # Nginx web server config
│   ├── php/
│   │   └── Dockerfile       # PHP 8.2-FPM with OCI8 (optional)
│   └── instantclient/       # Oracle Instant Client (optional)
├── src/
│   ├── app/
│   │   └── index.php        # Application entry point
│   └── public/
│       ├── index.php        # Public PHP file
│       └── test-connection.php  # DB connection test
├── vendor/
│   └── schwi/database/      # Local database component
├── composer.json            # PHP dependencies
├── .env                     # Environment variables
├── .env.example             # Example environment config
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Linux system (or Linux VM on Mac/Windows)
- Minimum 4GB RAM allocated to Docker
- 20GB+ free disk space
- Optional: SQL*Plus client for direct database access

### Starting the Container

```bash
# Navigate to the container directory
cd app-oracle

# Setup environment file (if not already configured)
cp .env.example .env

# Start all services (this will take several minutes for Oracle to initialize)
docker-compose up -d

# Monitor startup progress
docker-compose logs -f db

# Check when Oracle is ready (look for "DATABASE IS READY TO USE!")
```

⏳ **Note**: Oracle Database initialization typically takes 10-15 minutes on first startup.

### Access the Application

- **Web Interface**: http://localhost:8080
- **Oracle Port**: localhost:1521
- **Connection Test**: http://localhost:8080/test-connection.php

### Stopping the Container

```bash
docker-compose down
```

## ⚙️ Configuration

Edit the `.env` file to customize database settings:

```env
# Oracle Database Configuration
ORACLE_PWD=OraclePass123              # SYS and SYSTEM user password
ORACLE_CHARACTERSET=AL32UTF8          # Database character set
ORACLE_SID=FREE                        # Oracle System Identifier
ORACLE_PDB=FREEPDB1                    # Pluggable database name

# PHP/Database Component Configuration
DB_TYPE=oracle                         # Database type
DB_HOST=db                             # Database host (Docker service)
DB_PORT=1521                           # Oracle listener port
DB_NAME=FREEPDB1                       # Pluggable database to connect
DB_USER=system                         # Application user
DB_PASSWORD=OraclePass123              # Application user password
```

## 🔧 Services

| Service | Image | Port | Container Name |
|---------|-------|------|-----------------|
| **Web Server** | nginx:alpine | 8080 | myapp-nginx-oracle |
| **PHP Application** | php:8.2-fpm-bullseye | 9000 | myapp-php-oracle |
| **Database** | container-registry.oracle.com/database/free:latest | 1521 | myapp-oracle |

## 💾 Database Component Usage

The Schwi Database component is included for easy database operations:

### Simple Queries

```php
<?php
use Schwi\\Database\\DatabaseConnection;

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
use Schwi\\Database\\DatabaseConnection;

DatabaseConnection::execute(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    ['Oracle User', 'oracle@example.com']
);
```

### Transactions

```php
<?php
use Schwi\\Database\\DatabaseConnection;

try {
    DatabaseConnection::beginTransaction();
    // ... execute queries ...
    DatabaseConnection::commit();
} catch (Exception $e) {
    DatabaseConnection::rollback();
}
```

## 🛠️ OCI8 Extension (Optional)

The default PHP Dockerfile uses basic PDO drivers. For full OCI8 support:

### Why OCI8 is needed

OCI8 provides:
- Direct Oracle protocol support (vs. PDO abstraction)
- Better performance for Oracle operations
- Access to Oracle-specific features

### Installation Steps

#### 1. Download Oracle Instant Client

Visit: https://www.oracle.com/database/technologies/instant-client/downloads.html

Download for your architecture:
- **For Linux x86_64**: `instantclient-basic-linux.x86_64-21.1.0.0.0.zip`
- **For Linux ARM64**: `instantclient-basic-linux.arm64-21.1.0.0.0.zip`

#### 2. Setup Local Directory

```bash
mkdir -p docker/instantclient
# Extract the ZIP file contents into this directory
unzip instantclient-basic-linux.*.zip -d docker/instantclient
```

#### 3. Update Dockerfile

Edit `docker/php/Dockerfile`:

```dockerfile
FROM php:8.2-fpm-bullseye

# Install system dependencies
RUN apt-get update && \\
    apt-get install -y --no-install-recommends \\
    libaio1 \\
    libaio-dev \\
    ca-certificates \\
    curl \\
    build-essential && \\
    rm -rf /var/lib/apt/lists/*

# Copy Oracle Instant Client
COPY docker/instantclient /opt/oracle/instantclient

# Set environment variables for Oracle
ENV ORACLE_HOME=/opt/oracle/instantclient
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient:$LD_LIBRARY_PATH

# Install PDO and OCI8 extensions
RUN docker-php-ext-install pdo pdo_mysql && \\
    docker-php-ext-configure oci8 --with-oci8=instantclient,/opt/oracle/instantclient && \\
    docker-php-ext-install oci8

WORKDIR /var/www/html
```

#### 4. Rebuild and Start

```bash
# Rebuild Docker image with OCI8
docker compose build --no-cache

# Start containers fresh
docker compose down -v
docker compose up -d

# Verify OCI8 is loaded
docker exec myapp-php-oracle php -m | grep oci
```

If successful, you should see `oci8` in the output.

## 🧪 Testing the Connection

Visit http://localhost:8080/test-connection.php to:
- Verify database connectivity
- Display database version and info
- Test basic queries

## 🐳 Docker Compose Services

### nginx Service
- Reverse proxy and web server
- Listens on port 8080
- Routes requests to PHP-FPM
- Serves static files directly

### php Service
- PHP 8.2 with FPM (FastCGI Process Manager)
- Pre-installed extensions: PDO, Composer
- OCI8 available with optional setup
- Mounts source code from `./src`
- Connects to Oracle database

### db Service
- Oracle Database Free 23c
- Automatic database initialization
- Data persisted in Docker volume
- Accessible at localhost:1521

## 🔐 Security Notes

- Update default passwords in `.env` for production use
- Database credentials are stored in environment variables
- Consider using `.env.example` as a template without storing secrets
- Use strong passwords for `ORACLE_PWD`

## 📚 Common Commands

```bash
# View container logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f php
docker-compose logs -f db

# Connect to Oracle with SQL*Plus
docker-compose exec db sqlplus system/OraclePass123

# Access PHP shell
docker-compose exec php bash

# Check OCI8 extension
docker-compose exec php php -m | grep oci

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🔄 Data Persistence

- Oracle data is stored in a Docker volume named `oradata`
- Volume persists even after containers are stopped
- To remove all data: `docker-compose down -v`
- To backup: Use Oracle export tools or Docker volume copy

## 🚨 Troubleshooting

### Oracle Database Not Starting

**Symptoms**: Database container keeps restarting

**Solutions**:
```bash
# Check Oracle initialization logs
docker-compose logs -f db

# Ensure sufficient resources
docker stats  # Check RAM usage

# Increase Docker memory allocation and retry
```

### OCI8 Extension Not Loading

**Symptoms**: Application shows "OCI8 Extension Not Loaded" warning

**Solution**:
1. Verify instantclient folder exists: `ls docker/instantclient/`
2. Rebuild image: `docker compose build --no-cache`
3. Check logs: `docker compose logs php`

### Connection Refused

**Symptoms**: "Connection refused" error when accessing application

**Possible causes**:
1. Oracle DB not fully initialized yet (5-10 min on first run)
2. Wrong credentials in `.env`
3. PHP OCI8 extension not loaded

**Solutions**:
```bash
# Check Oracle status
docker-compose ps db

# View Oracle initialization logs
docker-compose logs -f db

# Verify credentials
cat .env | grep DB_
```

### Ports Already in Use

```bash
# Find what's using port 8080
lsof -i :8080

# Find what's using port 1521
lsof -i :1521

# Kill process (if needed)
kill -9 <PID>
```

## 📖 More Information

For more details about the database component, see the main [../README.md](../README.md)
- Use secrets management (Docker Secrets, HashiCorp Vault, etc.)

## Resources

- [Docker Documentation](https://docs.docker.com/reference/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PHP PDO Documentation](https://www.php.net/manual/en/book.pdo.php)
- [PHP OCI8 Extension](https://www.php.net/manual/en/book.oci8.php)
- [Oracle Instant Client Downloads](https://www.oracle.com/database/technologies/instant-client/)
- [Oracle Database Free](https://www.oracle.com/database/free/)

## Support

If you encounter issues:

1. Check logs: `docker compose logs`
2. Verify configuration: `cat .env`
3. Ensure ports are available: `lsof -i :8080` and `lsof -i :1521`
4. Read troubleshooting section above
5. Review the service-specific documentation linked in Resources

