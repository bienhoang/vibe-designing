FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY dist/tunnel.js ./tunnel.js

EXPOSE 3055

CMD ["node", "tunnel.js"]
