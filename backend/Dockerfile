# Stage 1: Build TypeScript source & Prisma client
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src/ ./src/
COPY prisma/ ./prisma/

RUN npx prisma generate
RUN pnpm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

RUN npm install -g pnpm@9

# Writable home directory for non-root 'node' user
ENV HOME=/home/node
RUN mkdir -p /home/node && chown -R node:node /home/node

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY --from=builder --chown=node:node /app/dist ./dist

# Set ownership of /app to node user
RUN chown -R node:node /app

USER node

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js && node dist/src/server.js"]
