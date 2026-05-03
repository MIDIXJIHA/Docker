FROM php:8.2-fpm

# Install dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    && docker-php-ext-install pdo pdo_mysql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html

# Copy composer files if they exist
COPY composer.json* ./
RUN if [ -f "composer.json" ]; then composer install --no-dev --optimize-autoloader || true; fi

EXPOSE 9000

CMD ["php-fpm"]