FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY index.html ./

# Install dependencies including serve
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build

# Install serve globally for production file serving
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Serve built files
CMD ["serve", "-s", "dist", "-l", "3000"]