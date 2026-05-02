# Oracle Container Setup

This is a PHP/Nginx application container setup with Oracle Database Free.

## Quick Start

```bash
# Start containers
docker compose up -d

# Access web application
# http://localhost:8080

# Check status
docker compose ps

# View logs
docker compose logs -f
```

## Current Status

✅ **Application is running and accessible**

⚠️ **OCI8 Extension: NOT currently installed**

When you visit http://localhost:8080, the application will detect OCI8 is missing and display helpful instructions.

## Services

| Service | Image | Port | Container Name |
|---------|-------|------|-----------------|
| Web Server | nginx:alpine | 8080 | myapp-nginx-oracle |
| PHP-FPM | custom (php:8.2-fpm-bullseye) | 9000 | myapp-php-oracle |
| Database | container-registry.oracle.com/database/free | 1521 | myapp-oracle |

## Configuration

### Environment Variables

Edit `.env` to customize database settings:

```env
ORACLE_PWD=OraclePass123              # Oracle SYS user password
ORACLE_CHARACTERSET=AL32UTF8          # Database character set
ORACLE_SID=FREEPDB1                   # Oracle System Identifier
DB_HOST=db                            # Database host (Docker service)
DB_PORT=1521                          # Oracle listener port
DB_NAME=FREEPDB1                      # Pluggable database name
DB_USER=system                        # Application database user
DB_PASSWORD=OraclePass123             # Application database password
```

## Enabling OCI8 Support

### Why OCI8 is needed

The application uses PDO with Oracle's OCI driver to connect to the database. This requires:

1. **PHP OCI8 Extension** - PHP module for Oracle connectivity
2. **Oracle Instant Client** - Oracle client libraries

The Dockerfile currently includes PDO with MySQL support, but OCI8 requires downloading Oracle Instant Client separately due to licensing requirements.

### Installation Steps

#### 1. Download Oracle Instant Client

Visit: https://www.oracle.com/database/technologies/instant-client/downloads.html

Select your platform:
- **For ARM64 (M1/M2/M3 Mac, ARM servers):** `instantclient-basic-linux.arm64-21.1.0.0.0.zip`
- **For x86_64 (Intel/AMD):** `instantclient-basic-linux.x86-64-21.1.0.0.0.zip`

#### 2. Setup Local Directory

Create directory and extract:

```bash
mkdir -p docker/instantclient_21_9
# Extract the ZIP file contents into this directory
unzip instantclient-basic-linux.*.zip -d docker/instantclient_21_9
```

#### 3. Update Dockerfile

Edit `docker/php/Dockerfile` to:

```dockerfile
FROM php:8.2-fpm-bullseye

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libaio1 \
    libaio-dev \
    ca-certificates \
    curl \
    build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy Oracle Instant Client
COPY docker/instantclient_21_9 /opt/oracle/instantclient_21_9

# Set environment variables for Oracle
ENV ORACLE_HOME=/opt/oracle/instantclient_21_9
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_9:$LD_LIBRARY_PATH

# Install PDO and OCI8 extensions
RUN docker-php-ext-install pdo pdo_mysql && \
    docker-php-ext-configure oci8 --with-oci8=instantclient,/opt/oracle/instantclient_21_9 && \
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

## Usage

### Accessing the Application

- **Web Interface**: http://localhost:8080
- **Database Host**: localhost:1521

### Testing Oracle Connection

After enabling OCI8, visit http://localhost:8080 to test the connection.

The `index.php` will attempt to:
1. Connect to Oracle database
2. Query the database version
3. Display connection status

### Working with Database

```bash
# Connect to Oracle with SQL*Plus
docker exec -it myapp-oracle sqlplus system/OraclePass123@freepdb1

# Or from the PHP container
docker exec -it myapp-php-oracle php -r "
  \$conn = oci_connect('system', 'OraclePass123', 'db:1521/freepdb1');
  if (\$conn) echo 'Connected!';
  else echo 'Failed';
"

# Run SQL scripts
docker exec -it myapp-oracle sqlplus system/OraclePass123 @/path/to/script.sql
```

## Docker Commands

```bash
# View all running containers
docker compose ps

# View detailed logs
docker compose logs -f

# View specific service logs
docker compose logs -f app      # PHP-FPM
docker compose logs -f nginx    # Nginx
docker compose logs -f db       # Oracle DB

# Execute command in container
docker exec -it myapp-php-oracle bash

# Check PHP info
docker exec myapp-php-oracle php -info | grep -i oci

# Stop containers
docker compose down

# Stop and remove all data (careful!)
docker compose down -v
```

## Troubleshooting

### OCI8 Extension Not Loading

**Symptoms**: Application shows "OCI8 Extension Not Loaded" warning

**Solution**:
1. Verify instantclient folder exists: `ls docker/instantclient_21_9/`
2. Rebuild image: `docker compose build --no-cache`
3. Check logs: `docker compose logs app`

### Oracle Database Connection Failed

**Symptoms**: "Connection failed" error when visiting http://localhost:8080

**Possible causes**:
1. Oracle DB not initialized yet (takes 5-10 minutes on first run)
2. Credentials wrong in `.env`
3. OCI8 extension not loaded

**Solutions**:
```bash
# Check Oracle status
docker compose ps db  # Should show "healthy" or "Up"

# View Oracle initialization logs
docker compose logs -f db  # Wait for "Database is ready to use"

# Check credentials
cat .env | grep DB_

# Verify connection parameters
docker exec myapp-php-oracle php -r "
  echo 'Trying to connect...' . PHP_EOL;
  \$conn = oci_connect('system', 'OraclePass123', 'db:1521/freepdb1');
  echo \$conn ? 'Success' : 'Failed: ' . oci_error()['message'];
"
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

### Fresh Start

```bash
# Stop all containers
docker compose down

# Remove volume (deletes database)
docker volume rm app-oracle_dbdata

# Remove image
docker rmi app-oracle-app

# Rebuild everything
docker compose build --no-cache

# Start fresh
docker compose up -d
```

## Performance Notes

- **First startup**: 5-10 minutes (Oracle initialization)
- **RAM required**: 2GB minimum for Oracle
- **Disk space**: 10GB for Oracle ORADATA volume
- **Image sizes**:
  - PHP image: ~400MB
  - Oracle image: ~5GB

## File Structure

```
app-oracle/
├── docker-compose.yml           # Container orchestration
├── docker/
│   ├── nginx/
│   │   └── default.conf         # Nginx config
│   ├── php/
│   │   └── Dockerfile           # PHP image definition
│   └── instantclient_21_9/      # Oracle Instant Client (after setup)
├── src/
│   └── index.php                # Sample application
├── .env                         # Configuration
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## Security Notes

⚠️ **Development Only**: This setup is for development and testing.

For production:
- Change default passwords
- Use `.env.local` (not in version control)
- Enable HTTPS/SSL in Nginx
- Implement proper backup strategy
- Run with proper permissions and firewall rules
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

