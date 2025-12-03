FROM node:20-alpine

WORKDIR /usr/src/app

COPY services/gateway/package*.json ./services/gateway/
RUN cd services/gateway && npm ci --only=production

COPY services/gateway ./services/gateway
COPY shared ./shared

WORKDIR /usr/src/app/services/gateway

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
