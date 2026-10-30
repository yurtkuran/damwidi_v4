# Build React frontend
FROM node:20-bookworm-slim AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build


# Build production application
FROM node:20-bookworm-slim

ENV NODE_ENV=production
ENV PORT=5001

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js ./
COPY config/ ./config/
COPY middleware/ ./middleware/
COPY models/ ./models/
COPY routes/ ./routes/
COPY services/ ./services/

COPY --from=frontend-build /app/client/build ./client/build

EXPOSE 5001

CMD ["node", "server.js"]