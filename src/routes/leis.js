import { Router } from "express";
import multer from "multer";
import fs from "fs";
import pool from "../config/db.js";

const router = Router();

// Garantir que o diretório uploads existe
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Criar lei
router.post("/", upload.single("documento"), async (req, res) => {
  try {
    const { nome, link, temas, temasIds } = req.body;
    const documento = req.file ? req.file.path : null;

    // Aceitar tanto 'temas' (FormData stringify) quanto 'temasIds' (JSON)
    const temasIdsRaw = temas || temasIds;

    if (!temasIdsRaw) {
      return res.status(400).json({ 
        error: "Pelo menos um tema deve ser vinculado à lei" 
      });
    }

    // Parse se for string, senão usa direto
    const temasArray = typeof temasIdsRaw === 'string' 
      ? JSON.parse(temasIdsRaw) 
      : temasIdsRaw;

    if (!Array.isArray(temasArray) || temasArray.length === 0) {
      return res.status(400).json({ 
        error: "Pelo menos um tema deve ser vinculado à lei" 
      });
    }

    // Validar se todos os temas existem
    for (const temaId of temasArray) {
      const tema = await pool.query(
        'SELECT id FROM temas WHERE id = $1',
        [parseInt(temaId)]
      );
      
      if (tema.rows.length === 0) {
        return res.status(400).json({ 
          error: `Tema não encontrado: ${temaId}` 
        });
      }
    }

    // Inserir lei
    const result = await pool.query(
      'INSERT INTO leis (nome, link, documento) VALUES ($1, $2, $3) RETURNING *',
      [nome, link, documento]
    );

    const novaLei = result.rows[0];

    // Vincular temas
    for (const temaId of temasArray) {
      await pool.query(
        'INSERT INTO leis_temas (lei_id, tema_id) VALUES ($1, $2)',
        [novaLei.id, parseInt(temaId)]
      );
    }

    res.status(201).json({
      id: novaLei.id.toString(),
      nome: novaLei.nome,
      link: novaLei.link,
      documento: novaLei.documento,
      temasIds: temasArray.map(id => id.toString())
    });
  } catch (error) {
    console.error('Erro ao criar lei:', error);
    res.status(500).json({ error: 'Erro ao criar lei' });
  }
});

// Listar leis
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM leis ORDER BY created_at DESC'
    );

    const leis = await Promise.all(
      result.rows.map(async (lei) => {
        const temas = await pool.query(
          'SELECT tema_id FROM leis_temas WHERE lei_id = $1',
          [lei.id]
        );

        return {
          id: lei.id.toString(),
          nome: lei.nome,
          link: lei.link,
          documento: lei.documento,
          temasIds: temas.rows.map(t => t.tema_id.toString())
        };
      })
    );

    res.json(leis);
  } catch (error) {
    console.error('Erro ao listar leis:', error);
    res.status(500).json({ error: 'Erro ao listar leis' });
  }
});

// Buscar lei por ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM leis WHERE id = $1',
      [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lei não encontrada" });
    }

    const lei = result.rows[0];

    const temas = await pool.query(
      'SELECT tema_id FROM leis_temas WHERE lei_id = $1',
      [lei.id]
    );

    res.json({
      id: lei.id.toString(),
      nome: lei.nome,
      link: lei.link,
      documento: lei.documento,
      temasIds: temas.rows.map(t => t.tema_id.toString())
    });
  } catch (error) {
    console.error('Erro ao buscar lei:', error);
    res.status(500).json({ error: 'Erro ao buscar lei' });
  }
});

// Atualizar lei
router.put("/:id", upload.single("documento"), async (req, res) => {
  try {
    const leiId = parseInt(req.params.id);
    const { nome, link, temas: temasIds } = req.body;

    // Verificar se a lei existe
    const leiExistente = await pool.query(
      'SELECT * FROM leis WHERE id = $1',
      [leiId]
    );

    if (leiExistente.rows.length === 0) {
      return res.status(404).json({ error: "Lei não encontrada" });
    }

    const lei = leiExistente.rows[0];

    // Atualizar campos básicos
    const documento = req.file ? req.file.path : lei.documento;

    await pool.query(
      'UPDATE leis SET nome = $1, link = $2, documento = $3 WHERE id = $4',
      [nome || lei.nome, link || lei.link, documento, leiId]
    );

    // Se novos temas foram fornecidos, atualizar vinculações
    if (temasIds) {
      const temasArray = JSON.parse(temasIds);

      // Validar se todos os temas existem
      for (const temaId of temasArray) {
        const tema = await pool.query(
          'SELECT id FROM temas WHERE id = $1',
          [parseInt(temaId)]
        );
        
        if (tema.rows.length === 0) {
          return res.status(400).json({ 
            error: `Tema não encontrado: ${temaId}` 
          });
        }
      }

      // Remover vinculações antigas
      await pool.query('DELETE FROM leis_temas WHERE lei_id = $1', [leiId]);

      // Adicionar novas vinculações
      for (const temaId of temasArray) {
        await pool.query(
          'INSERT INTO leis_temas (lei_id, tema_id) VALUES ($1, $2)',
          [leiId, parseInt(temaId)]
        );
      }
    }

    // Buscar lei atualizada
    const leiAtualizada = await pool.query(
      'SELECT * FROM leis WHERE id = $1',
      [leiId]
    );

    const temas = await pool.query(
      'SELECT tema_id FROM leis_temas WHERE lei_id = $1',
      [leiId]
    );

    res.json({
      id: leiAtualizada.rows[0].id.toString(),
      nome: leiAtualizada.rows[0].nome,
      link: leiAtualizada.rows[0].link,
      documento: leiAtualizada.rows[0].documento,
      temasIds: temas.rows.map(t => t.tema_id.toString())
    });
  } catch (error) {
    console.error('Erro ao atualizar lei:', error);
    res.status(500).json({ error: 'Erro ao atualizar lei' });
  }
});

// Deletar lei
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM leis WHERE id = $1 RETURNING *',
      [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lei não encontrada" });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar lei:', error);
    res.status(500).json({ error: 'Erro ao deletar lei' });
  }
});

export default router;