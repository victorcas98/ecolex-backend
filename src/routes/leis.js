import { Router } from "express";
import multer from "multer";

const router = Router();

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// "Banco" em memória
let leis = [];

// Criar lei
router.post("/", upload.single("documento"), (req, res) => {
  const { nome, link } = req.body;
  const documento = req.file ? req.file.path : null;

  const novaLei = {
    id: leis.length + 1,
    nome,
    documento,
    link,
    temas: [], // apenas IDs de temas depois
  };

  leis.push(novaLei);
  res.status(201).json(novaLei);
});

// Listar leis
router.get("/", (req, res) => res.json(leis));

// Buscar lei por ID
router.get("/:id", (req, res) => {
  const lei = leis.find((l) => l.id === parseInt(req.params.id));
  if (!lei) return res.status(404).json({ error: "Lei não encontrada" });
  res.json(lei);
});

// Atualizar lei
router.put("/:id", upload.single("documento"), (req, res) => {
  const lei = leis.find((l) => l.id === parseInt(req.params.id));
  if (!lei) return res.status(404).json({ error: "Lei não encontrada" });

  lei.nome = req.body.nome || lei.nome;
  lei.link = req.body.link || lei.link;
  if (req.file) lei.documento = req.file.path;

  res.json(lei);
});

// Deletar lei
router.delete("/:id", (req, res) => {
  leis = leis.filter((l) => l.id !== parseInt(req.params.id));
  res.status(204).send();
});

export default router;
