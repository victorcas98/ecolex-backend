# 🚀 Guia de Deploy no Render + Neon - MVP

Este guia contém o passo a passo completo para fazer deploy do backend no **Render** usando banco de dados **Neon**.

---

## 📋 **Pré-requisitos**

- ✅ Conta no GitHub
- ✅ Código commitado no repositório GitHub
- ✅ Conta no Render (gratuita)
- ✅ Conta no Neon (gratuita)

---

## 🗄️ **PASSO 1: Configurar Banco de Dados Neon**

### 1.1 Criar Projeto no Neon

1. Acesse: https://neon.tech
2. Clique em **"Sign Up"** ou **"Login with GitHub"**
3. Clique em **"Create a project"**
4. Configure:
   - **Project name**: `ecolex-db` (ou nome de sua preferência)
   - **Database name**: `neondb` (padrão)
   - **Region**: `US East (Ohio)` (ou mais próximo)
5. Clique em **"Create Project"**

### 1.2 Copiar Connection String

1. Após criar, você verá a **Connection String**
2. Copie a URL que começa com `postgresql://`
3. **IMPORTANTE**: Salve essa URL em local seguro
4. Exemplo:
   ```
   postgresql://usuario:senha@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 1.3 Executar Schema no Neon

1. No painel do Neon, clique em **"SQL Editor"**
2. Copie todo o conteúdo do arquivo `schema.sql` do seu projeto
3. Cole no editor SQL e clique em **"Run"**
4. Verifique se todas as tabelas foram criadas com sucesso

---

## 🚀 **PASSO 2: Criar Projeto no Render**

### 2.1 Acessar Render

1. Acesse: https://render.com
2. Clique em **"Get Started for Free"**
3. Escolha **"Login with GitHub"**
4. Autorize o Render a acessar seus repositórios

### 2.2 Criar Novo Web Service

1. No Dashboard, clique em **"New +"**
2. Selecione **"Web Service"**
3. Conecte seu repositório GitHub: `ecolex-backend`
4. Clique em **"Connect"**

### 2.3 Configurar o Serviço

Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Name** | `ecolex-backend` (ou nome de sua preferência) |
| **Region** | Escolha a mesma região do Neon (ex: Ohio) |
| **Branch** | `main` |
| **Root Directory** | (deixe em branco) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

---

## ⚙️ **PASSO 3: Configurar Variáveis de Ambiente**

### 3.1 Adicionar Environment Variables

Antes de fazer deploy, role até **"Environment Variables"** e adicione:

| Variável | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Cole a Connection String do Neon aqui |

**Exemplo do DATABASE_URL**:
```
postgresql://neondb_owner:npg_xxxxx@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 3.2 Iniciar Deploy

1. Após adicionar as variáveis, clique em **"Create Web Service"**
2. O Render vai começar o build automaticamente
3. Aguarde 2-5 minutos para o deploy completar

---

## 🗂️ **PASSO 4: Verificar Deploy**

### 4.1 Acessar Logs

1. No painel do Render, vá em **"Logs"**
2. Você deve ver:
   ```
   ========================================
   ✅ CONECTADO AO BANCO DE DADOS!
   ========================================
   📦 Database: neondb
   ☁️  PROVEDOR: NEON (cloud)
   ```

### 4.2 Testar API

1. Copie a URL do serviço (ex: `https://ecolex-backend.onrender.com`)
2. Teste no navegador:
   ```
   https://ecolex-backend.onrender.com/api/health
   ```
3. Deve retornar status 200 OK

---

## 🔄 **PASSO 5: Executar Migrations (Opcional)**

Se você fez alterações no schema após o deploy inicial:

### 5.1 Via Render Shell

1. No Render, clique em **"Shell"** (no menu lateral)
2. Execute:
   ```bash
   npm run migrate
   ```

### 5.2 Via SQL Editor do Neon

1. Acesse o painel do Neon
2. Vá em **"SQL Editor"**
3. Cole o conteúdo de `migrations/001_update_schema.sql`
4. Clique em **"Run"**

---

## 🌐 **PASSO 6: Configurar Frontend**

### 6.1 Adicionar URL do Backend no Frontend

No projeto `ecolex-frontend`, crie/edite o arquivo `.env`:

```bash
VITE_API_URL=https://seu-backend.onrender.com
```

Substitua `seu-backend.onrender.com` pela URL real do Render.

### 6.2 Verificar CORS

O backend já está configurado para aceitar requisições do frontend. Verifique em `src/index.js`:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

---

## 🔧 **PASSO 7: Preparar Repositório GitHub (para próximos deploys)**

### 7.1 Verificar arquivos necessários

Certifique-se que estes arquivos existem:
- ✅ `.gitignore` (com `.env` e `node_modules/`)
- ✅ `.env.example` (exemplo das variáveis)
- ✅ `package.json` (com `engines` e scripts configurados)
- ✅ `schema.sql` (schema do banco)

### 7.2 Commitar e enviar para GitHub

```bash
git add .
git commit -m "Preparar para deploy no Render com Neon"
git push origin main
```

**OBS**: O Render fará **auto-deploy** sempre que você fizer push para a branch `main`!

---

## 📊 **PASSO 8: Monitoramento e Troubleshooting**

### 8.1 Monitorar Logs do Render

- Acesse **"Logs"** no painel do Render
- Verifique mensagens de erro ou avisos
- Logs são atualizados em tempo real

### 8.2 Monitorar Banco de Dados Neon

- Acesse o painel do Neon
- Vá em **"Monitoring"** para ver:
  - Conexões ativas
  - Uso de storage
  - Queries executadas

### 8.3 Problemas Comuns

#### ❌ Erro: "Failed to connect to database"
**Solução**: Verifique se `DATABASE_URL` está correta no Render e inclui `?sslmode=require`

#### ❌ Erro: "Table does not exist"
**Solução**: Execute o `schema.sql` no SQL Editor do Neon

#### ❌ Erro: "Build failed"
**Solução**: Verifique se `package.json` tem os scripts `start` e as dependências corretas

#### ❌ Frontend não conecta ao backend
**Solução**: 
1. Verifique se `VITE_API_URL` no frontend está correto
2. Verifique CORS no backend
3. Certifique-se que o backend está rodando (status "Live" no Render)

---

## 🎯 **Checklist Final de Deploy**

- [ ] Banco de dados criado no Neon
- [ ] Schema executado no Neon (tabelas criadas)
- [ ] Web Service criado no Render
- [ ] `DATABASE_URL` configurada no Render
- [ ] Deploy completado com sucesso
- [ ] Logs mostram "CONECTADO AO BANCO DE DADOS"
- [ ] Endpoint `/api/health` respondendo
- [ ] Frontend configurado com URL do backend
- [ ] CORS funcionando entre frontend e backend

---

## 🚀 **Próximos Passos**

### Deploy do Frontend

Se seu frontend está em repositório separado:

1. No Render, clique em **"New +" → "Static Site"**
2. Conecte o repositório `ecolex-frontend`
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Adicione a variável de ambiente:
   - `VITE_API_URL`: URL do backend no Render

### Domínio Customizado (Opcional)

1. No Render, vá em **"Settings" → "Custom Domain"**
2. Adicione seu domínio
3. Configure DNS conforme instruções do Render

---

## 💡 **Dicas de Performance**

### Neon
- ✅ **Auto-suspend**: Banco hiberna após inatividade (plano gratuito)
- ✅ **Auto-scale**: Ajusta recursos automaticamente
- ✅ **Branching**: Crie branches do banco para testes

### Render
- ✅ **Auto-deploy**: Push no GitHub = deploy automático
- ✅ **Health checks**: Render monitora a saúde do serviço
- ✅ **Sleep após inatividade**: Serviço gratuito dorme após 15min (demora ~30s para acordar)

---

## 📚 **Recursos Úteis**

- [Documentação Neon](https://neon.tech/docs)
- [Documentação Render](https://render.com/docs)
- [Connection Pooling Neon](https://neon.tech/docs/connect/connection-pooling)
- [Deploy Node.js no Render](https://render.com/docs/deploy-node-express-app)

---

## ✅ **Deploy Concluído!**

Seu backend agora está rodando em:
- 🗄️ **Banco de Dados**: Neon (PostgreSQL serverless)
- 🚀 **Backend**: Render (auto-deploy ativado)
- 🌐 **URL**: `https://seu-servico.onrender.com`

**Tudo funcionando!** 🎉

1. Clique no serviço **PostgreSQL**
2. Vá na aba **"Data"**
3. Clique em **"Query"**

### 5.2 Executar Schema

1. Abra o arquivo `schema.sql` do seu projeto
2. **Copie todo o conteúdo**
3. Cole no Query Editor do Railway
4. Clique em **"Run Query"**
5. Aguarde a mensagem de sucesso

### 5.3 Verificar Tabelas Criadas

1. Ainda no Query Editor, execute:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
2. Você deve ver as tabelas:
   - `projetos`
   - `temas_projeto`
   - `requisitos`
   - `anexos`
   - `leis`
   - `temas`
   - `leis_temas`
   - `leis_requisito`

---

## 🚀 **PASSO 6: Deploy Final**

### 6.1 Fazer Redeploy

1. Volte no serviço do **backend**
2. Vá na aba **"Deployments"**
3. Clique nos **"..."** do último deploy
4. Selecione **"Redeploy"**

### 6.2 Aguardar Deploy Completo

- Railway vai rebuildar e reiniciar o servidor
- Aguarde até aparecer **"Success"** (≈ 2-3 minutos)

### 6.3 Obter URL Pública

1. Na aba **"Settings"** do backend
2. Em **"Networking"**, clique em **"Generate Domain"**
3. Railway vai gerar uma URL tipo: `https://ecolex-backend-production-xxxx.up.railway.app`
4. **Copie essa URL!**

---

## ✅ **PASSO 7: Testar Backend**

### 7.1 Testar Rota Principal

Abra no navegador:
```
https://seu-app.railway.app/
```

Deve retornar:
```json
{
  "message": "✅ Backend ECOLEX funcionando!",
  "version": "1.0.0",
  "baseUrl": "https://seu-app.railway.app"
}
```

### 7.2 Testar Rotas da API

```bash
# Listar projetos (deve retornar array vazio)
GET https://seu-app.railway.app/api/projetos

# Listar temas
GET https://seu-app.railway.app/api/temas

# Listar leis
GET https://seu-app.railway.app/api/leis
```

---

## 🔧 **PASSO 8: Conectar Frontend**

### 8.1 Atualizar Variável no Frontend

No seu projeto frontend, atualize a URL da API:

```javascript
// .env (frontend)
VITE_API_URL=https://seu-app.railway.app/api
```

ou

```javascript
// config.js (frontend)
const API_URL = 'https://seu-app.railway.app/api';
```

### 8.2 Testar Integração

1. Faça deploy do frontend (Vercel/Netlify)
2. Teste criar um projeto
3. Teste adicionar evidências
4. Verifique se os dados persistem após refresh

---

## ⚠️ **IMPORTANTE: Uploads de Arquivos**

### Problema

Railway **apaga arquivos** da pasta `uploads/` ao reiniciar o servidor.

### Soluções

#### Opção 1: Aceitar Limitação (MVP)
- Avisar usuários que arquivos podem ser perdidos
- Deixar para resolver na próxima versão

#### Opção 2: Migrar para Cloudinary (Recomendado)

1. Criar conta gratuita: https://cloudinary.com
2. Instalar dependências:
   ```bash
   npm install cloudinary multer-storage-cloudinary
   ```
3. Adicionar variáveis no Railway:
   ```
   CLOUDINARY_CLOUD_NAME=seu_cloud_name
   CLOUDINARY_API_KEY=sua_key
   CLOUDINARY_API_SECRET=seu_secret
   ```
4. Atualizar código (veja documentação do Cloudinary)

---

## 📊 **Monitoramento**

### Ver Logs em Tempo Real

1. No Railway, clique no serviço do backend
2. Vá na aba **"Deployments"**
3. Clique no deployment ativo
4. Veja os logs em tempo real

### Erros Comuns

| Erro | Solução |
|------|---------|
| `DATABASE_URL not defined` | Adicionar variável `DATABASE_URL` |
| `Connection refused` | Verificar se banco está ativo |
| `Port already in use` | Remover variável `PORT` (Railway configura automaticamente) |
| `404 Not Found` | Verificar se rotas estão corretas |

---

## 🎉 **Pronto!**

Seu backend está rodando em produção no Railway!

**URLs Importantes:**
- Backend: `https://seu-app.railway.app`
- Dashboard: https://railway.app/dashboard

**Próximos Passos:**
1. ✅ Deploy do frontend
2. ✅ Conectar frontend ao backend
3. ✅ Testar todas as funcionalidades
4. ✅ (Opcional) Migrar uploads para Cloudinary

---

## 🆘 **Ajuda**

Se tiver problemas:
1. Verifique os logs no Railway
2. Confirme que todas as variáveis estão configuradas
3. Teste as rotas no Postman/Insomnia
4. Verifique se o schema foi executado corretamente

**Dúvidas?** Consulte a documentação: https://docs.railway.app
