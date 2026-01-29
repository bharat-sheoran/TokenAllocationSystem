FROM node:20-alpine

# -----------------------------
# Alpine-specific dependencies
# -----------------------------
# Prisma + some Node packages need libc compatibility
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 8080

# Run in DEV mode
CMD ["npm", "run", "dev"]
