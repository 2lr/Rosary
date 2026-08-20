# Build.
FROM node:22-slim AS build
WORKDIR /app

# better-sqlite3 is an optional dependency and needs a toolchain to compile.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# The build never touches the database; the secret only has to exist.
RUN SESSION_SECRET=build-time-placeholder npm run build

# Run.
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
COPY --from=build /app/lib/db/schema.ts ./lib/db/schema.ts
COPY --from=build /app/scripts ./scripts

EXPOSE 3000
# The schema is created with IF NOT EXISTS, so this is safe on every boot.
CMD ["sh", "-c", "npm run db:init && npm start"]
