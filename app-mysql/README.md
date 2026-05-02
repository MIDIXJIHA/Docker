# MySQL Container Setup

This is a PHP/Nginx application container setup with MySQL database.

## Structure

```
app-mysql/
├── docker-compose.yml      # Container orchestration configuration
├── docker/
│   ├── nginx/
│   │   └── default.conf    # Nginx configuration
│   └── php/
│       └── Dockerfile      # PHP with PDO MySQL extension
├── src/
│   └── index.php           # Sample PHP application with MySQL connection
├── .env                    # Environment variables
└── .gitignore
```

## Prerequisites

- Docker and Docker Compose installed

## Getting Started

1. **Start the containers:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - Web: `http://localhost:8080`
   - Database: Connect to `localhost:3306` with MySQL client

3. **Stop the containers:**
   ```bash
   docker-compose down
   ```

## Configuration

Edit the `.env` file to customize:
- `MYSQL_ROOT_PASSWORD` - MySQL root password
- `MYSQL_DATABASE` - Default database name
- `MYSQL_USER` - Application database user
- `MYSQL_PASSWORD` - Application database password

## Services

- **app** - PHP-FPM service with PDO MySQL extension
- **nginx** - Web server (port 8080)
- **db** - MySQL 8.0 database (port 3306)

## Notes

- Database data is persisted in a Docker volume
- Containers are configured to restart unless stopped
- First startup initializes the MySQL database automatically
