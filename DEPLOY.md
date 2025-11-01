# 🚀 Guia de Deploy no Railway - MVP

Este guia contém o passo a passo completo para fazer deploy do backend no Railway.

---

## 📋 **Pré-requisitos**

- ✅ Conta no GitHub
- ✅ Código commitado no repositório GitHub
- ✅ Conta no Railway (gratuita)

---

## 🚂 **PASSO 1: Preparar Repositório GitHub**

### 1.1 Verificar arquivos necessários

Certifique-se que estes arquivos existem:
- ✅ `.gitignore` (com `.env` e `node_modules/`)
- ✅ `.env.example` (exemplo das variáveis)
- ✅ `package.json` (com `engines` configurado)
- ✅ `schema.sql` (schema do banco)

### 1.2 Commitar e enviar para GitHub

```bash
git add .
git commit -m "Preparar para deploy no Railway"
git push origin main
```

---

## 🚂 **PASSO 2: Criar Projeto no Railway**

### 2.1 Acessar Railway

1. Acesse: https://railway.app
2. Clique em **"Login"**
3. Escolha **"Login with GitHub"**
4. Autorize o Railway a acessar seus repositórios

### 2.2 Criar Novo Projeto

1. Clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório: `tcc-backend`
4. Railway vai começar o deploy automaticamente

### 2.3 Aguardar Build Inicial

- Railway vai instalar dependências
- **Vai falhar na primeira vez** (normal, falta o banco de dados)
- Não se preocupe, vamos adicionar o banco agora!

---

## 🗄️ **PASSO 3: Adicionar PostgreSQL**

### 3.1 Adicionar Banco de Dados

1. No seu projeto Railway, clique em **"New"** (botão roxo)
2. Selecione **"Database"**
3. Escolha **"Add PostgreSQL"**
4. Railway vai criar o banco automaticamente

### 3.2 Conectar Banco ao Backend

1. Clique no serviço do **backend** (não no banco)
2. Vá na aba **"Variables"**
3. Clique em **"+ New Variable"** → **"Add Reference"**
4. Selecione o PostgreSQL e escolha **"DATABASE_URL"**
5. Railway vai adicionar automaticamente a variável

---

## ⚙️ **PASSO 4: Configurar Variáveis de Ambiente**

### 4.1 Adicionar Variáveis Manualmente

No serviço do **backend**, vá em **"Variables"** e adicione:

| Variável | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `BASE_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |
| `PORT` | (deixe em branco, Railway configura automaticamente) |

### 4.2 Verificar DATABASE_URL

- A variável `DATABASE_URL` deve estar preenchida automaticamente
- Exemplo: `postgresql://postgres:senha@host:5432/railway`

---

## 🗂️ **PASSO 5: Criar Schema do Banco**

### 5.1 Acessar Query Editor

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
3. Railway vai gerar uma URL tipo: `https://tcc-backend-production-xxxx.up.railway.app`
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
  "message": "✅ Backend TCC funcionando!",
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
