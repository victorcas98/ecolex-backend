import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import projetosRoutes from "./routes/projetos.js";
import leisRoutes from "./routes/leis.js";
import temasRoutes from "./routes/temas.js";
import requisitosRoutes from "./routes/requisitos.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Expor a pasta uploads como estático para download de arquivos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use("/api/projetos", projetosRoutes);
app.use("/api/leis", leisRoutes);
app.use("/api/temas", temasRoutes);
app.use("/api/requisitos", requisitosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`API rodando na porta ${PORT}`));
