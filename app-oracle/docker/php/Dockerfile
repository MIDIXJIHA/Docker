FROM php:8.2-fpm

# Install dependencies for OCI8
RUN apt-get update && apt-get install -y \
    libaio1 \
    libaio-dev \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Download and install Oracle Instant Client
RUN mkdir -p /opt/oracle && cd /opt/oracle && \
    wget https://download.oracle.com/otn_software/linux/instantclient/219/instantclient-basic-linux.x64-21.9.0.0.0dbru.zip && \
    unzip instantclient-basic-linux.x64-21.9.0.0.0dbru.zip && \
    rm instantclient-basic-linux.x64-21.9.0.0.0dbru.zip

# Set environment variables for Oracle
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_9:$LD_LIBRARY_PATH
ENV ORACLE_HOME=/opt/oracle/instantclient_21_9

# Install PHP OCI8 extension
RUN docker-php-ext-configure oci8 --with-oci8=instantclient,/opt/oracle/instantclient_21_9 && \
    docker-php-ext-install -j$(nproc) oci8 pdo pdo_oci

WORKDIR /var/www/html
