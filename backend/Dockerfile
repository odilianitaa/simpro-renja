FROM node:20-alpine

WORKDIR /app

# Salin package files
COPY package*.json ./

# Pasang dependensi production
RUN npm install --omit=dev

# Salin seluruh kode backend
COPY . .

# Ekspos port default
EXPOSE 5000

ENV NODE_ENV=production

# Jalankan server
CMD ["node", "src/index.js"]

