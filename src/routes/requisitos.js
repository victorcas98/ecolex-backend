import { Router } from "express";
import { getTemas, updateTemaVinculacoes } from "./temas.js";
import { getLeis } from "./leis.js";

const router = Router();

// "Banco" em memória
let requisitos = [];

// Criar requisito (OBRIGATÓRIO vincular a um tema)
router.post("/", (req, res) => {
  const { descricao, temaId } = req.body;

  if (!temaId) {
    return res.status(400).json({ 
      error: "ID do tema é obrigatório" 
    });
  }

  const temas = getTemas();
  const tema = temas.find(t => t.id === parseInt(temaId));
  
  if (!tema) {
    return res.status(400).json({ 
      error: "Tema não encontrado" 
    });
  }

  const novoRequisito = {
    id: requisitos.length + 1,
    descricao,
    temaId: parseInt(temaId),
  };

  requisitos.push(novoRequisito);

  // Atualizar vinculações no tema
  updateTemaVinculacoes(parseInt(temaId), getLeis(), requisitos);

  res.status(201).json(novoRequisito);
});

// Listar requisitos de um tema específico
router.get("/tema/:temaId", (req, res) => {
  const { temaId } = req.params;
  const requisitosDoTema = requisitos.filter((r) => r.temaId === parseInt(temaId));
  res.json(requisitosDoTema);
});

// Listar todos os requisitos
router.get("/", (req, res) => {
  const temas = getTemas();
  
  const requisitosComTema = requisitos.map(req => ({
    ...req,
    tema: temas.find(t => t.id === req.temaId)
  }));
  
  res.json(requisitosComTema);
});

// Buscar requisito por ID
router.get("/:id", (req, res) => {
  const requisito = requisitos.find((r) => r.id === parseInt(req.params.id));
  if (!requisito) return res.status(404).json({ error: "Requisito não encontrado" });

  const temas = getTemas();
  const requisitoComTema = {
    ...requisito,
    tema: temas.find(t => t.id === requisito.temaId)
  };

  res.json(requisitoComTema);
});

// Atualizar requisito
router.put("/:id", (req, res) => {
  const requisito = requisitos.find((r) => r.id === parseInt(req.params.id));
  if (!requisito) return res.status(404).json({ error: "Requisito não encontrado" });

  const { descricao, temaId } = req.body;

  requisito.descricao = descricao || requisito.descricao;

  // Se tema foi alterado, validar e atualizar vinculações
  if (temaId && parseInt(temaId) !== requisito.temaId) {
    const temas = getTemas();
    const novoTema = temas.find(t => t.id === parseInt(temaId));
    
    if (!novoTema) {
      return res.status(400).json({ error: "Novo tema não encontrado" });
    }

    const temaAntigoId = requisito.temaId;
    requisito.temaId = parseInt(temaId);

    // Atualizar vinculações nos temas
    updateTemaVinculacoes(temaAntigoId, getLeis(), requisitos);
    updateTemaVinculacoes(parseInt(temaId), getLeis(), requisitos);
  }

  res.json(requisito);
});

// Deletar requisito
router.delete("/:id", (req, res) => {
  const requisitoId = parseInt(req.params.id);
  const requisito = requisitos.find(r => r.id === requisitoId);
  
  if (requisito) {
    const temaId = requisito.temaId;
    requisitos = requisitos.filter((r) => r.id !== requisitoId);
    
    // Atualizar vinculações no tema
    updateTemaVinculacoes(temaId, getLeis(), requisitos);
  }
  
  res.status(204).send();
});

// Função exportada para obter requisitos (usada por outros módulos)
export const getRequisitos = () => requisitos;

export default router;