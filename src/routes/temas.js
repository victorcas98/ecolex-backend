import { Router } from "express";

const router = Router();

// "Banco" em memória
let temas = [];
let requisitos = []; // aqui vão os requisitos de todos os temas

// Criar tema vinculado a uma lei
router.post("/", (req, res) => {
  const { nome, leiId } = req.body;

  const novoTema = {
    id: temas.length + 1,
    nome,
    leiId: parseInt(leiId),
  };

  temas.push(novoTema);
  res.status(201).json(novoTema);
});

// Listar temas de uma lei
router.get("/lei/:leiId", (req, res) => {
  const { leiId } = req.params;
  const listaTemas = temas
    .filter((t) => t.leiId === parseInt(leiId))
    .map((t) => ({
      ...t,
      requisitos: requisitos.filter((r) => r.temaId === t.id),
    }));

  res.json(listaTemas);
});

// Listar TODOS os temas já com requisitos
router.get("/", (req, res) => {
  const resultado = temas.map((t) => ({
    ...t,
    requisitos: requisitos.filter((r) => r.temaId === t.id),
  }));

  res.json(resultado);
});

// Buscar um tema específico com requisitos
router.get("/:id", (req, res) => {
  const temaId = parseInt(req.params.id);
  const tema = temas.find((t) => t.id === temaId);

  if (!tema) return res.status(404).json({ error: "Tema não encontrado" });

  const temaComRequisitos = {
    ...tema,
    requisitos: requisitos.filter((r) => r.temaId === temaId),
  };

  res.json(temaComRequisitos);
});

// Atualizar tema
router.put("/:id", (req, res) => {
  const tema = temas.find((t) => t.id === parseInt(req.params.id));
  if (!tema) return res.status(404).json({ error: "Tema não encontrado" });

  tema.nome = req.body.nome || tema.nome;
  res.json(tema);
});

// Deletar tema (remove também os requisitos ligados)
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  temas = temas.filter((t) => t.id !== id);
  requisitos = requisitos.filter((r) => r.temaId !== id);
  res.status(204).send();
});

export default router;
