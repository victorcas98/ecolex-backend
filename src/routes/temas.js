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

// Adicionar campo `id` ao tema
router.post("/", (req, res) => {
  const { nome } = req.body;

  // Impedir duplicidade de nome
  if (temas.some((t) => t.nome === nome)) {
    return res.status(400).json({ error: "Nome de tema já existe" });
  }

  const novoTema = {
    id: temas.length + 1, // Adicionando ID único
    nome,
    leisIds: [], // lista de ids de leis às quais o tema pertence
    requisitosIds: [], // será atualizado quando requisitos forem vinculados
  };

  temas.push(novoTema);

  // Retornar no formato correto
  const temaFormatado = {
    id: novoTema.id.toString(), // Retornar ID como string
    nome: novoTema.nome,
    requisitosIds: novoTema.requisitosIds.map(id => id.toString()),
    leisIds: novoTema.leisIds.map(id => id.toString())
  };

  res.status(201).json(temaFormatado);
});

// Listar TODOS os temas com formato correto
router.get("/", (req, res) => {
  const temasFormatados = temas.map((tema) => ({
    id: tema.id.toString(), // Adicionando ID ao retorno
    nome: tema.nome,
    requisitosIds: tema.requisitosIds ? tema.requisitosIds.map(id => id.toString()) : [],
    leisIds: tema.leisIds ? tema.leisIds.map(id => id.toString()) : []
  }));

  res.json(temasFormatados);
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

// Buscar um tema
router.get("/:id", (req, res) => {
  const temaId = parseInt(req.params.id);
  const tema = temas.find((t) => t.id === temaId);

  if (!tema) return res.status(404).json({ error: "Tema não encontrado" });

  const temaFormatado = {
    id: tema.id.toString(), // Adicionando ID ao retorno
    nome: tema.nome,
    requisitosIds: tema.requisitosIds ? tema.requisitosIds.map(id => id.toString()) : [],
    leisIds: tema.leisIds ? tema.leisIds.map(id => id.toString()) : []
  };

  res.json(temaFormatado);
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

  // Retornar no formato correto
  const temaFormatado = {
    id: tema.id.toString(), // Adicionando ID ao retorno
    nome: tema.nome,
    requisitosIds: tema.requisitosIds ? tema.requisitosIds.map(id => id.toString()) : [],
    leisIds: tema.leisIds ? tema.leisIds.map(id => id.toString()) : []
  };

  res.json(temaFormatado);
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
export const updateTemaLeisVinculacoes = (temaId, leiId) => {
  const tema = temas.find(t => t.id === temaId);
  if (!tema) {
    return;
  }

  console.log(`Tema encontrado: ${tema.nome}, leisIds antes:`, tema.leisIds); // Debug
  
  // Adicionar o novo ID ao array de leisIds, evitando duplicatas
  if (!tema.leisIds.includes(leiId)) {
    tema.leisIds.push(leiId);
    console.log(`Lei ${leiId} adicionada ao tema ${temaId}. LeisIds depois:`, tema.leisIds); // Debug
  } else {
    console.log(`Lei ${leiId} já existe no tema ${temaId}`); // Debug
  }
};

export const updateTemaRequisitosVinculacoes = (temaId, requisitoId) => {
  const tema = temas.find(t => t.id === temaId);
  if (!tema) return;

  // Adicionar o novo ID ao array de requisitosIds, evitando duplicatas
  if (!tema.requisitosIds.includes(requisitoId)) {
    tema.requisitosIds.push(requisitoId);
  }
};

// opcional: manter função combinada para compatibilidade
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