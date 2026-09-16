FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY site.config.mjs ./
COPY scripts ./scripts
COPY src ./src
RUN CONTACT_MODE=server node scripts/build.mjs

FROM node:22-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node server ./server
COPY --chown=node:node db ./db
COPY --chown=node:node src/admin ./src/admin
USER node
EXPOSE 8080
CMD ["node", "server/index.mjs"]
