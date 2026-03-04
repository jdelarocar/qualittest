# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY server ./server

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server/index.js"]
