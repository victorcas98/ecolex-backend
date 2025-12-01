import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

// Criar requisito dentro de um projeto (usado internamente)
// Esta rota não é mais usada diretamente - requisitos são criados junto com projetos

// Listar requisitos de um tema específico dentro de um projeto
router.get("/tema/:temaProjetoId", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM requisitos WHERE tema_projeto_id = $1',
      [parseInt(req.params.temaProjetoId)]
    );

    const requisitos = await Promise.all(
      result.rows.map(async (req) => {
        const leis = await pool.query(
          'SELECT lei_id FROM leis_requisito WHERE requisito_id = $1',
          [req.id]
        );

        const anexos = await pool.query(
          'SELECT * FROM anexos WHERE requisito_id = $1',
          [req.id]
        );

        return {
          id: req.id,
          nome: req.nome,
          status: req.status,
          evidencia: req.evidencia || '',
          anexo: anexos.rows.map(a => ({
            nome: a.nome,
            caminho: a.caminho,
            data: a.data
          })),
          leisIds: leis.rows.map(l => l.lei_id.toString()),
          dataValidade: req.data_validade
        };
      })
    );

    res.json(requisitos);
  } catch (error) {
    console.error('Erro ao listar requisitos:', error);
    res.status(500).json({ error: 'Erro ao listar requisitos' });
  }
});

// Listar todos os requisitos
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM requisitos ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar requisitos:', error);
    res.status(500).json({ error: 'Erro ao listar requisitos' });
  }
});

// Buscar requisito por ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM requisitos WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Requisito não encontrado" });
    }

    const req = result.rows[0];

    const leis = await pool.query(
      'SELECT lei_id FROM leis_requisito WHERE requisito_id = $1',
      [req.id]
    );

    const anexos = await pool.query(
      'SELECT * FROM anexos WHERE requisito_id = $1',
      [req.id]
    );

    res.json({
      id: req.id,
      nome: req.nome,
      status: req.status,
      evidencia: req.evidencia || '',
      anexo: anexos.rows.map(a => ({
        nome: a.nome,
        caminho: a.caminho,
        data: a.data
      })),
      leisIds: leis.rows.map(l => l.lei_id.toString()),
      dataValidade: req.data_validade
    });
  } catch (error) {
    console.error('Erro ao buscar requisito:', error);
    res.status(500).json({ error: 'Erro ao buscar requisito' });
  }
});

// Atualizar requisito
router.put("/:id", async (req, res) => {
  try {
    const { nome, status, evidencia, dataValidade } = req.body;

    const result = await pool.query(
      'UPDATE requisitos SET nome = COALESCE($1, nome), status = COALESCE($2, status), evidencia = COALESCE($3, evidencia), data_validade = COALESCE($4, data_validade) WHERE id = $5 RETURNING *',
      [nome, status, evidencia, dataValidade, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Requisito não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar requisito:', error);
    res.status(500).json({ error: 'Erro ao atualizar requisito' });
  }
});

// Deletar requisito
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM requisitos WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Requisito não encontrado" });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar requisito:', error);
    res.status(500).json({ error: 'Erro ao deletar requisito' });
  }
});

export default router;