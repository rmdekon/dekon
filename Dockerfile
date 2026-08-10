# DEKON deployment image (Node 24, built-in SQLite)
FROM node:24-alpine

WORKDIR /app

# Install production deps first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy the rest of the source
COPY . .

# The SQLite database lives here; mount a volume to persist it
RUN mkdir -p /app/data
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.js"]
