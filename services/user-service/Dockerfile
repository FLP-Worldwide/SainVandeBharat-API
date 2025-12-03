FROM node:20-alpine

WORKDIR /usr/src/app

COPY services/user-service/package*.json ./services/user-service/
RUN cd services/user-service && npm ci --only=production

COPY services/user-service ./services/user-service
COPY shared ./shared

WORKDIR /usr/src/app/services/user-service

ENV NODE_ENV=production
ENV PORT=4100

EXPOSE 4100

CMD ["node", "server.js"]
