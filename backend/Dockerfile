# ---- Stage 1: install production dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: small runtime image ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# the SQLite file lives here; the non-root user must be able to write to it
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "index.js"]
