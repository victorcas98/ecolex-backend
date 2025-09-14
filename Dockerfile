# Use node oficial
FROM node:18

# Create app dir
WORKDIR /app

# Copia package files e instala dependências
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Expõe porta
EXPOSE 3000

# Start (para produção)
CMD ["node", "src/index.js"]
