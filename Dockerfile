FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

RUN npm i @nestjs/cli -g

EXPOSE 3000
CMD ["npm", "run", "start:dev"]
