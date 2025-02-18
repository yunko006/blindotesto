FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY postcss.config.mjs ./
COPY tailwind.config.ts ./
COPY tsconfig.json ./
RUN npm install

EXPOSE 3000

CMD ["npm", "run", "dev"]