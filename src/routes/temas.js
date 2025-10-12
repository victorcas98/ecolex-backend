import { Router } from "express";

const router = Router();

// "Banco" em memória
let temas = [];
let requisitos = []; // importado dos requisitos
let leis = []; // importado das leis

// Função para atualizar vinculações no tema
const atualizarVinculacoesTema = (temaId) => {
  const tema = temas.find(t => t.id === temaId);
  if (!tema) return;

  // Buscar leis vinculadas a este tema (um tema pode pertencer a várias leis)
  const leisVinculadas = leis.filter(lei => lei.temas && lei.temas.includes(temaId));
  tema.leisIds = leisVinculadas.map(l => l.id);

  // Buscar requisitos vinculados a este tema
  tema.requisitosIds = requisitos
    .filter(req => req.temaId === temaId)
    .map(req => req.id);
};

// Criar tema (independente)
router.post("/", (req, res) => {
  const { nome } = req.body;

  // Impedir duplicidade de nome
  if (temas.some((t) => t.nome === nome)) {
    return res.status(400).json({ error: "Nome de tema já existe" });
  }

  const novoTema = {
    id: temas.length + 1,
    nome,
    leisIds: [], // lista de ids de leis às quais o tema pertence
    requisitosIds: [], // será atualizado quando requisitos forem vinculados
  };

  temas.push(novoTema);
  res.status(201).json(novoTema);
});

// Listar TODOS os temas com informações completas
router.get("/", (req, res) => {
  const resultado = temas.map((tema) => ({
    ...tema,
    leis: tema.leisIds ? leis.filter(l => tema.leisIds.includes(l.id)) : [],
    requisitos: requisitos.filter((r) => r.temaId === tema.id),
  }));

  res.json(resultado);
});

// Listar temas não vinculados a nenhuma lei
router.get("/sem-lei", (req, res) => {
  const temasLivres = temas
    .filter((t) => !t.leisIds || t.leisIds.length === 0)
    .map((tema) => ({
      ...tema,
      requisitos: requisitos.filter((r) => r.temaId === tema.id),
    }));

  res.json(temasLivres);
});

// Buscar um tema específico com informações completas
router.get("/:id", (req, res) => {
  const temaId = parseInt(req.params.id);
  const tema = temas.find((t) => t.id === temaId);

  if (!tema) return res.status(404).json({ error: "Tema não encontrado" });

  const temaCompleto = {
    ...tema,
    leis: tema.leisIds ? leis.filter(l => tema.leisIds.includes(l.id)) : [],
    requisitos: requisitos.filter((r) => r.temaId === temaId),
  };

  res.json(temaCompleto);
});

// Atualizar tema (apenas nome)
router.put("/:id", (req, res) => {
  const tema = temas.find((t) => t.id === parseInt(req.params.id));
  if (!tema) return res.status(404).json({ error: "Tema não encontrado" });

  const novoNome = req.body.nome || tema.nome;
  // Se estiver mudando o nome, garantir que não exista duplicidade
  if (novoNome !== tema.nome && temas.some((t) => t.nome === novoNome)) {
    return res.status(400).json({ error: "Nome de tema já existe" });
  }

  tema.nome = novoNome;
  res.json(tema);
});

// Deletar tema (remove vinculações de leis e requisitos)
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  
  // Remove tema
  temas = temas.filter((t) => t.id !== id);
  
  // Remove requisitos vinculados
  requisitos = requisitos.filter((r) => r.temaId !== id);
  
  // Remove vinculação das leis
  leis.forEach(lei => {
    if (lei.temas) {
      lei.temas = lei.temas.filter(temaId => temaId !== id);
    }
  });
  
  res.status(204).send();
});

// Função exportada para atualizar vinculações (usada por outros módulos)
export const updateTemaVinculacoes = (temaId, leisArray, requisitosArray) => {
  leis = leisArray;
  requisitos = requisitosArray;
  atualizarVinculacoesTema(temaId);
};

// Função exportada para obter temas (usada por outros módulos)
export const getTemas = () => temas;

// Função exportada para definir temas (usada por outros módulos)
export const setTemas = (temasArray) => {
  temas = temasArray;
};

export default router;