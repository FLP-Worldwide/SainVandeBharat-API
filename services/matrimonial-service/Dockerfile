# services/<service-name>/Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A package.json must exist in each service folder
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Expose (allow override via env)
ARG PORT=3000
ENV PORT=${PORT}

# Use non-root user for better security (optional)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Start command (services should have a start script in package.json)
CMD ["node", "server.js"]
