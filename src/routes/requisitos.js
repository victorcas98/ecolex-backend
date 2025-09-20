import { Router } from "express";

const router = Router();

let requisitos = [];

// Criar requisito vinculado a um tema
router.post("/", (req, res) => {
  const { descricao, temaId } = req.body;

  const novoRequisito = {
    id: requisitos.length + 1,
    descricao,
    temaId: parseInt(temaId),
  };

  requisitos.push(novoRequisito);
  res.status(201).json(novoRequisito);
});

// Listar requisitos de um tema
router.get("/tema/:temaId", (req, res) => {
  const { temaId } = req.params;
  const listaReqs = requisitos.filter((r) => r.temaId === parseInt(temaId));
  res.json(listaReqs);
});

// Atualizar requisito
router.put("/:id", (req, res) => {
  const requisito = requisitos.find((r) => r.id === parseInt(req.params.id));
  if (!requisito) return res.status(404).json({ error: "Requisito não encontrado" });

  requisito.descricao = req.body.descricao || requisito.descricao;
  res.json(requisito);
});

// Deletar requisito
router.delete("/:id", (req, res) => {
  requisitos = requisitos.filter((r) => r.id !== parseInt(req.params.id));
  res.status(204).send();
});

export default router;
