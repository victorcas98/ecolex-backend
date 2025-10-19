import { Router } from "express";
import { getTemas, updateTemaVinculacoes, updateTemaRequisitosVinculacoes } from "./temas.js";
import { getLeis } from "./leis.js";

const router = Router();

// "Banco" em memória
let requisitos = [];

// Criar requisito (OBRIGATÓRIO vincular a um tema)
router.post("/", (req, res) => {
  const { nome, temaId } = req.body;

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
    nome,
    temaId: parseInt(temaId)
  };

  requisitos.push(novoRequisito);

  // Atualizar vinculações no tema
  updateTemaRequisitosVinculacoes(temaId, novoRequisito.id);

  // Adicionar o ID do requisito ao tema vinculado
  tema.requisitosIds.push(novoRequisito.id);

  // Retornar no formato correto
  const requisitoFormatado = {
    id: novoRequisito.id.toString(),
    nome: novoRequisito.nome,
    temaId: novoRequisito.temaId.toString()
  };

  res.status(201).json(requisitoFormatado);
});

// Listar requisitos de um tema específico
router.get("/tema/:temaId", (req, res) => {
  const { temaId } = req.params;
  const requisitosDoTema = requisitos.filter((r) => r.temaId === parseInt(temaId));
  res.json(requisitosDoTema);
});

// Listar todos os requisitos
router.get("/", (req, res) => {
  const requisitosFormatados = requisitos.map(req => ({
    id: req.id.toString(),
    nome: req.nome,
    temaId: req.temaId.toString()
  }));
  
  res.json(requisitosFormatados);
});

// Buscar requisito por ID
router.get("/:id", (req, res) => {
  const requisito = requisitos.find((r) => r.id === parseInt(req.params.id));
  if (!requisito) return res.status(404).json({ error: "Requisito não encontrado" });

  const requisitoFormatado = {
    id: requisito.id.toString(),
    nome: requisito.nome,
    temaId: requisito.temaId.toString()
  };

  res.json(requisitoFormatado);
});

// Atualizar requisito
router.put("/:id", (req, res) => {
  const requisito = requisitos.find((r) => r.id === parseInt(req.params.id));
  if (!requisito) return res.status(404).json({ error: "Requisito não encontrado" });

  const { nome, temaId } = req.body;

  requisito.nome = nome || requisito.nome;

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

  // Retornar no formato correto
  const requisitoFormatado = {
    id: requisito.id.toString(),
    nome: requisito.nome,
    temaId: requisito.temaId.toString()
  };

  res.json(requisitoFormatado);
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