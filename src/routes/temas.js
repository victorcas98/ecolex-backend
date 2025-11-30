import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

// Criar tema
router.post("/", async (req, res) => {
  try {
    const { nome } = req.body;

    // Verificar duplicidade
    const existente = await pool.query(
      'SELECT id FROM temas WHERE nome = $1',
      [nome]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({ error: "Nome de tema já existe" });
    }

    const result = await pool.query(
      'INSERT INTO temas (nome) VALUES ($1) RETURNING *',
      [nome]
    );

    const novoTema = result.rows[0];

    res.status(201).json({
      id: novoTema.id.toString(),
      nome: novoTema.nome,
      requisitosIds: [],
      leisIds: []
    });
  } catch (error) {
    console.error('Erro ao criar tema:', error);
    res.status(500).json({ error: 'Erro ao criar tema' });
  }
});

// Listar TODOS os temas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM temas ORDER BY created_at DESC'
    );

    const temas = await Promise.all(
      result.rows.map(async (tema) => {
        // Buscar leis vinculadas
        const leis = await pool.query(
          'SELECT lei_id FROM leis_temas WHERE tema_id = $1',
          [tema.id]
        );

        return {
          id: tema.id.toString(),
          nome: tema.nome,
          requisitosIds: [],
          leisIds: leis.rows.map(l => l.lei_id.toString())
        };
      })
    );

    res.json(temas);
  } catch (error) {
    console.error('Erro ao listar temas:', error);
    res.status(500).json({ error: 'Erro ao listar temas' });
  }
});

// Buscar um tema
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM temas WHERE id = $1',
      [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tema não encontrado" });
    }

    const tema = result.rows[0];

    // Buscar leis vinculadas
    const leis = await pool.query(
      'SELECT lei_id FROM leis_temas WHERE tema_id = $1',
      [tema.id]
    );

    res.json({
      id: tema.id.toString(),
      nome: tema.nome,
      requisitosIds: [],
      leisIds: leis.rows.map(l => l.lei_id.toString())
    });
  } catch (error) {
    console.error('Erro ao buscar tema:', error);
    res.status(500).json({ error: 'Erro ao buscar tema' });
  }
});

// Deletar tema
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM temas WHERE id = $1 RETURNING *',
      [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tema não encontrado" });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar tema:', error);
    res.status(500).json({ error: 'Erro ao deletar tema' });
  }
});

export default router;
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