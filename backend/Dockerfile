# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for build
# Scripts are now safe because prisma is copied above
RUN npm ci

# Now run prisma generate explicitly (redundant if postinstall runs it, but safe)
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

# Allow scripts to run (essential for bcrypt native bindings)
RUN npm ci --only=production


# Run prisma generate for production
RUN npx prisma generate

# Copy built artifacts from builder stage (FIX: This was missing!)
COPY --from=builder /app/dist ./dist

# Environment variables (Defaults, overridden by Digital Ocean)
ENV PORT=3000
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start command (includes migration deploy for safety)
# WARNING: 'prisma migrate deploy' assumes you have created migrations locally with 'prisma migrate dev'
# If you are strictly using 'db push', change this to 'npx prisma db push && node dist/index.js'
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
