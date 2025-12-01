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

// Atualizar tema
router.put("/:id", async (req, res) => {
  try {
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ error: "Nome é obrigatório" });
    }

    // Verificar duplicidade
    const existente = await pool.query(
      'SELECT id FROM temas WHERE nome = $1 AND id != $2',
      [nome, parseInt(req.params.id)]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({ error: "Nome de tema já existe" });
    }

    const result = await pool.query(
      'UPDATE temas SET nome = $1 WHERE id = $2 RETURNING *',
      [nome, parseInt(req.params.id)]
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
    console.error('Erro ao atualizar tema:', error);
    res.status(500).json({ error: 'Erro ao atualizar tema' });
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