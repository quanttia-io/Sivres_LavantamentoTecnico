FROM node:20-slim

# Install Chromium + dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# Tell Puppeteer to use the system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

# Copy workspace manifests first (for better layer caching)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/

# Copy Prisma schema (needed before install so @prisma/client generates correctly)
COPY prisma ./prisma

# Install only backend dependencies
RUN pnpm install --frozen-lockfile --filter @prss/backend...

# Copy all source code
COPY apps/backend ./apps/backend

# Generate Prisma client
RUN pnpm prisma generate

# Build NestJS
RUN pnpm --filter @prss/backend build

EXPOSE 3001

CMD ["node", "apps/backend/dist/main"]
