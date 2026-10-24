FROM node:22.19.0-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run build:server

FROM node:22.19.0-bookworm-slim
ENV NODE_ENV=production CARWASH_CONTAINER=1 CARWASH_DB_PATH=/data/carwash.sqlite CARWASH_TOKEN_PATH=/data/.local-admin-token
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/server/business-config.json ./server/business-config.json
RUN mkdir /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 4173
HEALTHCHECK --interval=20s --timeout=4s CMD node -e "fetch('http://127.0.0.1:4173/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist-server/start.mjs"]
