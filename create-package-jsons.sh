#!/usr/bin/env bash
set -e
services=("auth-service" "user-service" "shop-service" "matrimonial-service" "education-service" "community-service" "gateway")
for s in "${services[@]}"; do
  mkdir -p services/$s
  cat > services/$s/package.json <<JSON
{
  "name": "$s",
  "version": "0.0.1",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "mongoose": "^7.3.1",
    "ioredis": "^5.3.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
JSON
  echo "created services/$s/package.json"
done
echo "Done."
