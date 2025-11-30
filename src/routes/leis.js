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
    const { nome, link, temas: temasIds } = req.body;
    const documento = req.file ? req.file.path : null;

    if (!temasIds || !Array.isArray(JSON.parse(temasIds)) || JSON.parse(temasIds).length === 0) {
      return res.status(400).json({ 
        error: "Pelo menos um tema deve ser vinculado à lei" 
      });
    }

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

  const leiFormatada = {
    id: lei.id.toString(),
    nome: lei.nome,
    link: lei.link,
    documento: lei.documento,
    temasIds: lei.temas ? lei.temas.map(id => id.toString()) : []
  };

  res.json(leiFormatada);
});

// Atualizar lei
router.put("/:id", upload.single("documento"), (req, res) => {
  const lei = leis.find((l) => l.id === parseInt(req.params.id));
  if (!lei) return res.status(404).json({ error: "Lei não encontrada" });

  const { nome, link, temas: temasIds } = req.body;

  lei.nome = nome || lei.nome;
  lei.link = link || lei.link;
  if (req.file) lei.documento = req.file.path;

  // Se novos temas foram fornecidos, atualizar vinculações
  if (temasIds) {
    const temasArray = JSON.parse(temasIds);
    const temas = getTemas();

    // Validar se todos os temas existem
    const temasInvalidos = temasArray.filter(id => !temas.find(t => t.id === parseInt(id)));
    if (temasInvalidos.length > 0) {
      return res.status(400).json({ 
        error: `Temas não encontrados: ${temasInvalidos.join(', ')}` 
      });
    }

    // Atualizar temas antigos (remover vinculação)
    if (lei.temas) {
      lei.temas.forEach(temaId => {
        const tema = temas.find(t => t.id === temaId);
        if (tema) {
          tema.leisIds = tema.leisIds.filter(id => id !== lei.id);
        }
      });
    }

    lei.temas = temasArray.map(id => parseInt(id));

    // Atualizar novos temas (adicionar vinculação)
    lei.temas.forEach(temaId => {
      const tema = temas.find(t => t.id === temaId);
      if (tema) {
        tema.leisIds.push(lei.id);
      }
    });
  }

  // Retornar no formato correto
  const leiFormatada = {
    id: lei.id.toString(),
    nome: lei.nome,
    link: lei.link,
    documento: lei.documento,
    temasIds: lei.temas ? lei.temas.map(id => id.toString()) : []
  };

  res.json(leiFormatada);
});

// Deletar lei
router.delete("/:id", (req, res) => {
  const leiId = parseInt(req.params.id);
  const lei = leis.find(l => l.id === leiId);
  
  if (lei && lei.temas) {
    // Atualizar vinculações nos temas antes de deletar
    lei.temas.forEach(temaId => {
      updateTemaVinculacoes(temaId, leis.filter(l => l.id !== leiId), requisitos);
    });
  }
  
  leis = leis.filter((l) => l.id !== leiId);
  res.status(204).send();
});

// Função exportada para obter leis (usada por outros módulos)
export const getLeis = () => leis;

// Função exportada para definir requisitos (usada por outros módulos)
export const setRequisitos = (requisitosArray) => {
  requisitos = requisitosArray;
};

export default router;