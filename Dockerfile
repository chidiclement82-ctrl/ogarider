# Ogarider production image. Mount a persistent disk at /data.
FROM node:24-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
