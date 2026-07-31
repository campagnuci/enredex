# Build from monorepo root:  docker build -f apps/api/Dockerfile .
FROM node:24-alpine

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

# Copy workspace root files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./

# Copy package manifests for dependency resolution
COPY packages/database/package.json packages/database/
COPY packages/database/tsconfig.json packages/database/
COPY packages/shared/package.json packages/shared/
COPY packages/shared/tsconfig.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/api/tsconfig.json apps/api/
COPY packages/pokemon-data/package.json packages/pokemon-data/
COPY packages/pokemon-data/tsconfig.json packages/pokemon-data/

# Install dependencies (include devDeps — tsx is needed at runtime)
RUN pnpm install --frozen-lockfile

# Copy source code (workspace packages export .ts directly — tsx handles it)
COPY packages/database/src packages/database/src/
COPY packages/database/drizzle packages/database/drizzle/
COPY packages/database/drizzle.config.ts packages/database/
COPY packages/shared/src packages/shared/src/
COPY apps/api/src apps/api/src/

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

EXPOSE 3001

CMD ["node", "--import", "tsx/esm", "apps/api/src/index.ts"]
