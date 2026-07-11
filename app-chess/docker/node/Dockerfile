FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache git

# Copy package files
COPY backend/package.json ./package.json

# Install dependencies
RUN npm install

# Copy application files
COPY backend/src ./src

EXPOSE 5002

CMD ["npm", "start"]