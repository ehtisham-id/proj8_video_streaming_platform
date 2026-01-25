# Use Node 20
FROM node:24-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files first
COPY package.json package-lock.json ./

RUN apk update && apk add ffmpeg

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "dist/main.js"]
