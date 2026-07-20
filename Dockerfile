# GinPerium — Node 24 auf Alpine. node:sqlite und node:crypto sind eingebaut ->
# keine nativen Abhängigkeiten, sauberer Build (auch arm64 für den Pi).
FROM node:24-alpine

# su-exec: im Entrypoint kurz als root das Datenverzeichnis übereignen,
# dann als unprivilegierter "node"-Nutzer weiterlaufen.
RUN apk add --no-cache su-exec

WORKDIR /app
ENV NODE_ENV=production
ENV DB_PATH=/data/ginperium.db

# Erst Manifeste (Layer-Cache), dann nur Produktionsabhängigkeiten.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY app.js server.js ./
COPY routes ./routes
COPY middleware ./middleware
COPY lib ./lib
COPY db ./db
COPY public ./public
COPY scripts ./scripts

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
