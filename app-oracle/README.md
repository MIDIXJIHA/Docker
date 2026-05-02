# Oracle Container Setup

This is an Oracle version of the PHP/Nginx application container setup.

## Structure

```
app-oracle/
├── docker-compose.yml      # Container orchestration configuration
├── docker/
│   ├── nginx/
│   │   └── default.conf    # Nginx configuration
│   └── php/
│       └── Dockerfile      # PHP with OCI8 extension
├── src/
│   └── index.php           # Sample PHP application with Oracle connection
├── .env                    # Environment variables
└── .gitignore
```

## Prerequisites

- Docker and Docker Compose installed
- Oracle Instant Client (included in Dockerfile)

## Getting Started

1. **Start the containers:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - Web: `http://localhost:8080`
   - Database: Connect to `localhost:1521` with SQL client

3. **Stop the containers:**
   ```bash
   docker-compose down
   ```

## Configuration

Edit the `.env` file to customize:
- `ORACLE_PWD` - Oracle SYS password
- `DB_USER` - Application database user
- `DB_PASSWORD` - Application database password
- `ORACLE_SID` - Oracle SID

## Services

- **app** - PHP-FPM service with OCI8 extension
- **nginx** - Web server (port 8080)
- **db** - Oracle Database Free Edition (port 1521)

## Notes

- First startup takes time as Oracle initializes (~5-10 minutes)
- Requires ~2GB RAM and 1GB SHM size
- Oracle Database Free requires Docker credential authentication
