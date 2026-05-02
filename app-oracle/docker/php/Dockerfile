FROM --platform=linux/amd64 php:8.2-fpm-bullseye

# -------------------------------------------------
# System dependencies
# -------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    unzip \
    git \
    libaio1 \
    libaio-dev \
    gcc \
    g++ \
    make \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# -------------------------------------------------
# PHP extensions (MySQL)
# -------------------------------------------------
RUN docker-php-ext-install pdo pdo_mysql

# -------------------------------------------------
# Oracle Instant Client setup
# -------------------------------------------------
WORKDIR /opt/oracle

COPY instantclient-basiclite.zip /tmp/
COPY instantclient-sdk.zip /tmp/

RUN mkdir -p /opt/oracle && \
    unzip /tmp/instantclient-basiclite.zip -d /opt/oracle && \
    unzip /tmp/instantclient-sdk.zip -d /opt/oracle && \
    rm -f /tmp/*.zip

# -------------------------------------------------
# Normalize to single stable directory
# (IMPORTANT: preserve SDK structure)
# -------------------------------------------------
RUN mkdir -p /opt/oracle/instantclient && \
    cp -r /opt/oracle/instantclient-basiclite-linux/instantclient_21_21/* /opt/oracle/instantclient/ && \
    cp -r /opt/oracle/instantclient-sdk-linux/instantclient_21_21/sdk /opt/oracle/instantclient/

# -------------------------------------------------
# Fix Oracle environment
# -------------------------------------------------
ENV ORACLE_HOME=/opt/oracle/instantclient
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient:$LD_LIBRARY_PATH

RUN echo "/opt/oracle/instantclient" > /etc/ld.so.conf.d/oracle.conf && ldconfig

# -------------------------------------------------
# Install OCI8 (CORRECT WAY)
# -------------------------------------------------
RUN printf "instantclient,/opt/oracle/instantclient\n" | \
    CFLAGS="-I/opt/oracle/instantclient/sdk/include" \
    pecl install oci8 && \
    docker-php-ext-enable oci8

# -------------------------------------------------
# Final working directory
# -------------------------------------------------
WORKDIR /var/www/html