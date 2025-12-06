# 🚀 Guia Rápido - ECOLEX Backend

## ⚡ Comandos Essenciais

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor (modo dev com auto-reload)
npm run dev

# Iniciar servidor (modo produção)
npm start

# Executar migration do banco
npm run migrate
```

---

## 🗄️ Configuração Neon (Banco de Dados)

### 1. Criar conta e projeto
- Acesse: https://neon.tech
- Crie uma conta gratuita
- Crie um novo projeto

### 2. Copiar connection string
```bash
# No painel do Neon, copie a Connection String
# Exemplo:
postgresql://neondb_owner:senha@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Configurar localmente
```bash
# Crie o arquivo .env
cp .env.example .env

# Edite o .env e cole a DATABASE_URL
# DATABASE_URL="postgresql://..."
```

### 4. Criar tabelas
```bash
# Opção 1: Via SQL Editor do Neon (recomendado)
# 1. Acesse o painel do Neon → SQL Editor
# 2. Copie e cole o conteúdo do arquivo schema.sql
# 3. Clique em "Run"

# Opção 2: Via migration local
npm run migrate
```

---

## 🌐 Deploy no Render

### 1. Criar Web Service
- Acesse: https://render.com
- New + → Web Service
- Conecte o repositório GitHub

### 2. Configurar
```
Name: ecolex-backend
Environment: Node
Build Command: npm install
Start Command: npm start
```

### 3. Variáveis de Ambiente
```
DATABASE_URL = <sua_connection_string_do_neon>
NODE_ENV = production
```

### 4. Deploy
- Clique em "Create Web Service"
- Aguarde o deploy (2-5 minutos)

---

## 🧪 Testar API

### Localmente

```bash
# Teste básico
curl http://localhost:3000/

# Health check
curl http://localhost:3000/api/health

# Listar projetos
curl http://localhost:3000/api/projetos

# Listar leis
curl http://localhost:3000/api/leis

# Listar temas
curl http://localhost:3000/api/temas
```

### Em Produção (Render)

```bash
# Substitua SEU_APP pelo nome real
curl https://seu-app.onrender.com/api/health
```

---

## 🔧 Troubleshooting Rápido

### ❌ Erro de conexão com banco
```bash
# Verifique se DATABASE_URL está definida
echo $DATABASE_URL   # Linux/Mac
echo %DATABASE_URL%  # Windows CMD
$env:DATABASE_URL    # Windows PowerShell

# Deve ter ?sslmode=require no final
# Exemplo correto:
# postgresql://user:pass@host/db?sslmode=require
```

### ❌ Tabelas não existem
```bash
# Execute o schema no Neon SQL Editor
# OU
npm run migrate
```

### ❌ Erro de CORS no frontend
```bash
# Adicione no .env do backend:
FRONTEND_URL=http://localhost:5173

# OU para produção:
FRONTEND_URL=https://seu-frontend.vercel.app
```

### ❌ Upload de arquivos não funciona
```bash
# Verifique se a pasta existe
mkdir -p uploads/evidencias

# No Windows PowerShell
New-Item -ItemType Directory -Force -Path uploads/evidencias
```

---

## 📊 Monitoramento

### Logs do Render
```
Dashboard → Seu serviço → Logs (tab)
```

### Monitorar Neon
```
Dashboard Neon → Monitoring
- Conexões ativas
- Storage usado
- Queries por segundo
```

---

## 🔄 Auto-Deploy (Render)

```bash
# Qualquer push no GitHub faz deploy automático
git add .
git commit -m "Atualização"
git push origin main

# Render detecta e faz deploy automaticamente
```

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `.env` | Variáveis de ambiente (não commitar) |
| `schema.sql` | Schema inicial do banco |
| `src/index.js` | Servidor Express principal |
| `src/config/db.js` | Configuração do PostgreSQL |
| `src/migrate.js` | Script de migration |
| `DEPLOY.md` | Guia completo de deploy |

---

## 🎯 Checklist de Setup

- [ ] Node.js 18+ instalado
- [ ] Conta no Neon criada
- [ ] Projeto criado no Neon
- [ ] Schema executado no Neon
- [ ] `.env` configurado localmente
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor rodando localmente (`npm run dev`)
- [ ] API testada e respondendo
- [ ] Repositório no GitHub
- [ ] Web Service criado no Render
- [ ] Variáveis configuradas no Render
- [ ] Deploy concluído no Render

---

## 💡 Dicas

### Performance
- Neon hiberna após inatividade (plano gratuito)
- Primeira requisição pode demorar ~1-2s
- Render hiberna após 15min inativo (plano gratuito)

### Desenvolvimento
- Use `npm run dev` para auto-reload
- Teste localmente antes de fazer push
- Verifique logs no Render após deploy

### Segurança
- **NUNCA** commite o arquivo `.env`
- Use `.env.example` como template
- Regenere senhas se expor acidentalmente

---

## 📚 Links Úteis

- [Neon Dashboard](https://console.neon.tech)
- [Render Dashboard](https://dashboard.render.com)
- [Express Docs](https://expressjs.com/)
- [Node-postgres](https://node-postgres.com/)

---

**Tudo pronto!** 🎉

Se tiver dúvidas, consulte o [DEPLOY.md](./DEPLOY.md) para instruções detalhadas.
