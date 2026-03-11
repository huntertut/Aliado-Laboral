# Use Node.js LTS
FROM node:18-alpine

# Install OpenSSL (Required for Prisma)
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start command (can be overridden by docker-compose)
CMD ["npm", "start"]
