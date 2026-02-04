# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for build
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts and prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Environment variables (Defaults, overridden by Digital Ocean)
ENV PORT=3000
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start command (includes migration deploy for safety)
# WARNING: 'prisma migrate deploy' assumes you have created migrations locally with 'prisma migrate dev'
# If you are strictly using 'db push', change this to 'npx prisma db push && node dist/index.js'
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
