FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# Skip Chromium download (puppeteer used only for PDF — configure separately in prod)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

# Copy workspace manifests first (for better layer caching)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Copy Prisma schema (needed before install so @prisma/client generates correctly)
COPY prisma ./prisma

# Install only backend dependencies
RUN pnpm install --frozen-lockfile --filter @prss/backend...

# Copy all source code
COPY packages ./packages
COPY apps/backend ./apps/backend

# Generate Prisma client
RUN pnpm prisma generate

# Build NestJS
RUN pnpm --filter @prss/backend build

EXPOSE 3001

CMD ["node", "apps/backend/dist/main"]
