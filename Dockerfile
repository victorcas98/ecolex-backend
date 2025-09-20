# Use Node oficial
FROM node:18

# Cria diretório da app
WORKDIR /app

# Copia package.json e package-lock.json e instala dependências
COPY package*.json ./
RUN npm install
RUN npm install -g nodemon

# Copia o restante do código
COPY . .

# Expõe porta
EXPOSE 3000

# Start padrão (produção)
CMD ["node", "src/index.js"]
