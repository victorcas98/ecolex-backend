import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

async function resolveTemaProjetoId(temaId, projetoId, { createIfMissing = false } = {}) {
  if (temaId === undefined || temaId === null || temaId === '') {
    return { ok: false, message: "temaId é obrigatório" };
  }

  const temaIdInt = parseInt(temaId, 10);
  if (Number.isNaN(temaIdInt)) {
    return { ok: false, message: "temaId inválido" };
  }

  const parsedProjetoId = projetoId !== undefined && projetoId !== null && projetoId !== ''
    ? parseInt(projetoId, 10)
    : null;

  if (parsedProjetoId !== null && Number.isNaN(parsedProjetoId)) {
    return { ok: false, message: "projetoId inválido" };
  }

  // 1) tentar interpretar como id direto de temas_projeto
  const direto = await pool.query(
    'SELECT id, projeto_id FROM temas_projeto WHERE id = $1',
    [temaIdInt]
  );

  if (direto.rows.length === 1) {
    if (parsedProjetoId !== null && direto.rows[0].projeto_id !== parsedProjetoId) {
      return { ok: false, message: "Tema não pertence ao projeto informado" };
    }
    return { ok: true, value: direto.rows[0].id };
  }

  // 2) interpretar como id da tabela temas
  const temaRow = await pool.query('SELECT id, nome FROM temas WHERE id = $1', [temaIdInt]);
  if (temaRow.rows.length === 0) {
    return { ok: false, message: "Tema não encontrado" };
  }

  const params = [temaRow.rows[0].id];
  let query = 'SELECT id FROM temas_projeto WHERE tema_id = $1';
  if (parsedProjetoId !== null) {
    params.push(parsedProjetoId);
    query += ' AND projeto_id = $2';
  }
  query += ' ORDER BY created_at DESC LIMIT 1';

  const existente = await pool.query(query, params);
  if (existente.rows.length === 1) {
    return { ok: true, value: existente.rows[0].id };
  }

  if (!createIfMissing) {
    return { ok: false, message: "Tema do projeto não encontrado" };
  }

  const novoTemaProjeto = await pool.query(
    'INSERT INTO temas_projeto (projeto_id, tema_id, nome) VALUES ($1, $2, $3) RETURNING id',
    [parsedProjetoId, temaRow.rows[0].id, temaRow.rows[0].nome]
  );

  return { ok: true, value: novoTemaProjeto.rows[0].id };
}

// Criar requisito
router.post("/", async (req, res) => {
  try {
    const { nome, temaId, leisIds, projetoId } = req.body;

    if (!nome || !temaId) {
      return res.status(400).json({ 
        error: "nome e temaId são obrigatórios" 
      });
    }

    const temaProjeto = await resolveTemaProjetoId(temaId, projetoId, { createIfMissing: true });
    if (!temaProjeto.ok) {
      return res.status(400).json({ error: temaProjeto.message });
    }

    // Gerar ID único para o requisito
    const id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Inserir requisito
    const result = await pool.query(
      'INSERT INTO requisitos (id, tema_projeto_id, nome, status, evidencia) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, temaProjeto.value, nome, 'pendente', '']
    );

    const novoRequisito = result.rows[0];

    // Vincular leis se fornecidas
    if (leisIds && Array.isArray(leisIds)) {
      for (const leiId of leisIds) {
        await pool.query(
          'INSERT INTO leis_requisito (requisito_id, lei_id) VALUES ($1, $2)',
          [id, parseInt(leiId)]
        );
      }
    }

    res.status(201).json({
      id: novoRequisito.id,
      nome: novoRequisito.nome,
      status: novoRequisito.status,
      evidencia: novoRequisito.evidencia,
      leisIds: leisIds || [],
      dataValidade: novoRequisito.data_validade
    });
  } catch (error) {
    console.error('Erro ao criar requisito:', error);
    res.status(500).json({ error: 'Erro ao criar requisito' });
  }
});

// Listar TODOS os requisitos
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

// Listar requisitos de um tema específico dentro de um projeto
router.get("/tema/:temaProjetoId", async (req, res) => {
  try {
    const temaProjeto = await resolveTemaProjetoId(
      req.params.temaProjetoId,
      req.query.projetoId,
      { createIfMissing: false }
    );
    if (!temaProjeto.ok) {
      if (temaProjeto.message === "Tema do projeto não encontrado" || temaProjeto.message === "Tema não encontrado") {
        return res.json([]);
      }
      return res.status(400).json({ error: temaProjeto.message });
    }

    const result = await pool.query(
      'SELECT * FROM requisitos WHERE tema_projeto_id = $1',
      [temaProjeto.value]
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