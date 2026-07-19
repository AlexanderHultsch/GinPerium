FROM node:24-alpine

# su-exec zum sauberen Fallenlassen von Root-Rechten nach dem Entrypoint
RUN apk add --no-cache su-exec

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV DB_PATH=/data/ginperium.sqlite
ENV PORT=3000
EXPOSE 3000

VOLUME ["/data"]

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
