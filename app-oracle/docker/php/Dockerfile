FROM php:8.2-fpm-bullseye

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl && \
    rm -rf /var/lib/apt/lists/*

# Install PDO extensions (MySQL for compatibility)
RUN docker-php-ext-install pdo pdo_mysql

# Note: For full OCI8 support with Oracle Instant Client:
# 1. Download Oracle Instant Client for your platform
# 2. Place in docker/instantclient_21_9/ folder
# 3. Uncomment OCI8 installation below
# 4. Rebuild: docker compose build --no-cache

# Optional: Uncomment to add OCI8 support
# RUN apt-get update && \
#     apt-get install -y --no-install-recommends \
#     libaio1 libaio-dev build-essential && \
#     rm -rf /var/lib/apt/lists/* && \
#     docker-php-ext-configure oci8 --with-oci8=instantclient,/opt/oracle/instantclient_21_9 && \
#     docker-php-ext-install oci8

WORKDIR /var/www/html
