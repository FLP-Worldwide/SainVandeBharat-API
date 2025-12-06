FROM node:20-alpine

WORKDIR /usr/src/app

COPY services/user-service/package*.json ./services/user-service/
COPY shared/package*.json ./shared/

COPY services/user-service ./services/user-service
COPY shared ./shared

# install deps for the service and for shared (shared gets its own node_modules)
RUN cd /usr/src/app/services/user-service && npm install --no-audit --no-fund \
 && cd /usr/src/app/shared && npm install --no-audit --no-fund

WORKDIR /usr/src/app/services/user-service

ENV PORT=4100
EXPOSE 4100

CMD ["npm", "run", "start"]
