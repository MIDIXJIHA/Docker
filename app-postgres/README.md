# PostgreSQL Docker Container

This is a PostgreSQL container setup with PHP and Nginx for testing and development.

## Services

- **PostgreSQL 15**: Database service
- **PHP 8.1-FPM**: PHP application runtime with PostgreSQL support
- **Nginx**: Web server (Alpine-based)

## Quick Start

### Prerequisites

- Docker and Docker Compose installed

### Running the Container

1. Navigate to this directory:

```bash
cd containers/app-postgres
```

2. Copy the .env.example file to .env:

```bash
cp .env.example .env
```

2. Start the container:

```bash
docker-compose up -d
```

3. Access the application:

- Web Interface: http://localhost:8081
- PostgreSQL Connection: `localhost:5432`

### Stopping the Container

```bash
docker-compose down
```

### Viewing Logs

```bash
docker-compose logs -f
```

### Connect to PostgreSQL Directly

```bash
docker exec -it myapp-postgres psql -U admin -d testdb
```

## Configuration

The `.env` file contains the following variables:

- `POSTGRES_ROOT_PASSWORD`: Root/default password
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database user password

## Files

- `docker-compose.yml`: Service configuration
- `.env`: Environment variables
- `docker/php/Dockerfile`: PHP image with PostgreSQL support
- `docker/nginx/default.conf`: Nginx configuration
- `src/index.php`: Test PHP application that connects to PostgreSQL

## Testing

The `src/index.php` file contains a connection test that:

1. Connects to the PostgreSQL database
2. Displays connection details
3. Retrieves and shows the PostgreSQL version

Access http://localhost:8081 to see the test results.
