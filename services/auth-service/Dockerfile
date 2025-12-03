FROM node:20-alpine

# Root of all services inside container
WORKDIR /usr/src/app

# 1) Install deps only for auth-service
COPY services/auth-service/package*.json ./services/auth-service/
RUN cd services/auth-service && npm ci --only=production

# 2) Copy service code
COPY services/auth-service ./services/auth-service

# 3) Copy shared code (if you use it)
COPY shared ./shared

# 4) Run from inside the service folder
WORKDIR /usr/src/app/services/auth-service

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "server.js"]
