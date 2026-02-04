# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for build
# Use --ignore-scripts to prevent postinstall from failing before files are ready
RUN npm ci --ignore-scripts

# Now run prisma generate explicitly with files present
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install only production dependencies
COPY package*.json ./
# Need prisma schema present for postinstall or runtime usage
COPY prisma ./prisma/

RUN npm ci --only=production --ignore-scripts

# Run prisma generate for production
RUN npx prisma generate

# Environment variables (Defaults, overridden by Digital Ocean)
ENV PORT=3000
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start command (includes migration deploy for safety)
# WARNING: 'prisma migrate deploy' assumes you have created migrations locally with 'prisma migrate dev'
# If you are strictly using 'db push', change this to 'npx prisma db push && node dist/index.js'
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
