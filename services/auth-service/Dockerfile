

FROM node:20-alpine

WORKDIR /usr/src/app

COPY services/auth-service/package*.json ./services/auth-service/
COPY shared/package*.json ./shared/

COPY services/auth-service ./services/auth-service
COPY shared ./shared

# install deps for the service and for shared (shared gets its own node_modules)
RUN cd /usr/src/app/services/auth-service && npm install --no-audit --no-fund \
 && cd /usr/src/app/shared && npm install --no-audit --no-fund

WORKDIR /usr/src/app/services/auth-service

ENV PORT=4000
EXPOSE 4000

CMD ["npm", "run", "start"]
