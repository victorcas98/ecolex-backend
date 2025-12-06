import 'dotenv/config';
import express from "express";
import cors from "cors";
import path from "path";

// 🔥 Importar db.js para executar o teste de conexão ao iniciar
import "./config/db.js";

import projetosRoutes from "./routes/projetos.js";
import leisRoutes from "./routes/leis.js";
import temasRoutes from "./routes/temas.js";
import requisitosRoutes from "./routes/requisitos.js";

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Middlewares
app.use(cors());
app.use(express.json());

// Expor a pasta uploads como estático para download de arquivos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rotas
app.get("/", (req, res) => {
  res.json({ 
    message: "✅ Backend ECOLEX funcionando!", 
    version: "1.0.0",
    baseUrl: BASE_URL
  });
});

// Health check endpoint para Render
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  });
});

app.use("/api/projetos", projetosRoutes);
app.use("/api/leis", leisRoutes);
app.use("/api/temas", temasRoutes);
app.use("/api/requisitos", requisitosRoutes);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em ${BASE_URL}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'}\n`);
});
