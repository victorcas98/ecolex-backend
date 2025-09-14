import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import projetosRoutes from "./routes/projetos.js";
import leisRoutes from "./routes/leis.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/projetos", projetosRoutes);
app.use("/api/leis", leisRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`API rodando na porta ${PORT}`));
