FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package first for caching
COPY services/gateway/package*.json ./services/gateway/

# Install deps
RUN cd services/gateway && npm install --only=production --no-audit --no-fund

# Copy source
COPY services/gateway ./services/gateway

WORKDIR /usr/src/app/services/gateway

EXPOSE 3000

CMD ["npm", "run", "start"]
