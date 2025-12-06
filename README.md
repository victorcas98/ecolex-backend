# 🌱 ECOLEX Backend

Backend para sistema de gestão de conformidade ambiental.

## 🚀 Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Banco de Dados**: PostgreSQL (Neon)
- **Deploy**: Render
- **Upload**: Multer (arquivos locais)

---

## 🛠️ Desenvolvimento Local

### 1. Pré-requisitos

- Node.js 18+ instalado
- Conta no Neon (gratuita)
- Git

### 2. Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/ecolex-backend.git
cd ecolex-backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL do Neon
```

### 3. Configurar Banco de Dados Neon

1. Acesse https://neon.tech e crie um projeto
2. Copie a **Connection String**
3. Cole no arquivo `.env` na variável `DATABASE_URL`
4. No painel do Neon, vá em **SQL Editor**
5. Execute o conteúdo do arquivo `schema.sql`

### 4. Executar

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

O servidor estará rodando em `http://localhost:3000`

### 5. Testar

```bash
# Teste de saúde
curl http://localhost:3000/

# Listar projetos
curl http://localhost:3000/api/projetos
```

---

## 📦 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm start` | Inicia o servidor em modo produção |
| `npm run dev` | Inicia o servidor com nodemon (auto-reload) |
| `npm run migrate` | Executa migrations do banco de dados |

---

## 🌐 Deploy no Render

Siga o guia completo em **[DEPLOY.md](./DEPLOY.md)**

**Resumo rápido**:

1. Crie banco no Neon e execute o `schema.sql`
2. Crie Web Service no Render conectando o repositório
3. Configure variável `DATABASE_URL` no Render
4. Deploy automático será feito a cada push

---

## 📁 Estrutura do Projeto

```
ecolex-backend/
├── src/
│   ├── config/
│   │   └── db.js              # Configuração do PostgreSQL
│   ├── routes/
│   │   ├── projetos.js        # CRUD de projetos
│   │   ├── leis.js            # CRUD de leis
│   │   ├── temas.js           # CRUD de temas
│   │   └── requisitos.js      # CRUD de requisitos + upload
│   ├── index.js               # Servidor Express
│   └── migrate.js             # Script de migration
├── migrations/
│   └── 001_update_schema.sql  # Migration do schema
├── uploads/
│   └── evidencias/            # Arquivos de evidências
├── schema.sql                 # Schema inicial do banco
├── reset-database.sql         # Script de reset (dev)
├── .env.example               # Exemplo de variáveis
├── package.json
├── DEPLOY.md                  # Guia de deploy detalhado
└── README.md                  # Este arquivo
```

---

## 🗂️ API Endpoints

### Projetos

- `GET /api/projetos` - Lista todos os projetos
- `GET /api/projetos/:id` - Busca projeto por ID
- `POST /api/projetos` - Cria novo projeto
- `PUT /api/projetos/:id` - Atualiza projeto
- `DELETE /api/projetos/:id` - Deleta projeto

### Leis

- `GET /api/leis` - Lista todas as leis
- `GET /api/leis/:id` - Busca lei por ID
- `POST /api/leis` - Cria nova lei
- `PUT /api/leis/:id` - Atualiza lei
- `DELETE /api/leis/:id` - Deleta lei

### Temas

- `GET /api/temas` - Lista todos os temas
- `POST /api/temas` - Cria novo tema

### Requisitos

- `GET /api/requisitos/projeto/:projetoId` - Lista requisitos de um projeto
- `POST /api/requisitos` - Cria novo requisito
- `PUT /api/requisitos/:id` - Atualiza requisito
- `DELETE /api/requisitos/:id` - Deleta requisito
- `POST /api/requisitos/:id/evidencia` - Upload de evidência (multipart/form-data)

---

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string do Neon | `postgresql://user:pass@host/db?sslmode=require` |
| `PORT` | Porta do servidor | `3000` |
| `NODE_ENV` | Ambiente de execução | `development` ou `production` |
| `FRONTEND_URL` | URL do frontend (CORS) | `https://seu-frontend.vercel.app` |

---

## 🐛 Troubleshooting

### Erro: "DATABASE_URL não definida"
**Solução**: Configure a variável no arquivo `.env`

### Erro: "Failed to connect to database"
**Solução**: Verifique se a `DATABASE_URL` está correta e inclui `?sslmode=require`

### Erro: "Table does not exist"
**Solução**: Execute o `schema.sql` no SQL Editor do Neon

### Upload de arquivos não funciona
**Solução**: Certifique-se que a pasta `uploads/evidencias` existe

---

## 📚 Recursos

- [Express.js](https://expressjs.com/)
- [Node-postgres](https://node-postgres.com/)
- [Neon Documentation](https://neon.tech/docs)
- [Render Documentation](https://render.com/docs)

---

## 📝 Licença

MIT

---

## 👨‍💻 Autor

Victor - [GitHub](https://github.com/victorcas98)
