# Build from monorepo root:  docker build -f apps/web/Dockerfile .
FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY apps/web/tsconfig.json apps/web/
COPY apps/web/vite.config.ts apps/web/
COPY apps/web/tsr.config.json apps/web/
COPY apps/web/index.html apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src/

RUN pnpm install --frozen-lockfile

COPY apps/web/src apps/web/src/

WORKDIR /app/apps/web
RUN npx vite build --outDir dist

# Serve static files with nginx
FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
