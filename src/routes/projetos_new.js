import { Router } from "express";
import multer from "multer";
import fs from "fs";
import pool from "../config/db.js";

const router = Router();

// Garantir que o diretório uploads/evidencias existe
const uploadDir = 'uploads/evidencias';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do multer para anexos de evidências
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

// Criar projeto completo
router.post("/", async (req, res) => {
  try {
    const { nome, temas } = req.body;

    if (!nome) {
      return res.status(400).json({ 
        error: "Nome do projeto é obrigatório" 
      });
    }

    if (!temas || !Array.isArray(temas) || temas.length === 0) {
      return res.status(400).json({ 
        error: "Pelo menos um tema deve ser fornecido" 
      });
    }

    // Verificar duplicidade
    const projetoExistente = await pool.query(
      'SELECT id FROM projetos WHERE nome = $1',
      [nome]
    );

    if (projetoExistente.rows.length > 0) {
      return res.status(400).json({ error: "Nome de projeto já existe" });
    }

    // Inserir projeto
    const resultProjeto = await pool.query(
      'INSERT INTO projetos (nome) VALUES ($1) RETURNING *',
      [nome]
    );

    const novoProjeto = resultProjeto.rows[0];

    // Inserir temas e requisitos
    for (const tema of temas) {
      const resultTema = await pool.query(
        'INSERT INTO temas_projeto (projeto_id, tema_id, nome) VALUES ($1, $2, $3) RETURNING *',
        [novoProjeto.id, Date.now() + Math.random(), tema.nome]
      );

      const temaProjeto = resultTema.rows[0];

      // Inserir requisitos do tema
      if (tema.requisitos && Array.isArray(tema.requisitos)) {
        for (const req of tema.requisitos) {
          await pool.query(
            'INSERT INTO requisitos (id, tema_projeto_id, nome, status, evidencia, data_validade) VALUES ($1, $2, $3, $4, $5, $6)',
            [req.id, temaProjeto.id, req.nome, req.status || 'pendente', req.evidencia || '', req.dataValidade || null]
          );

          // Vincular leis ao requisito
          if (req.leisIds && Array.isArray(req.leisIds)) {
            for (const leiId of req.leisIds) {
              await pool.query(
                'INSERT INTO leis_requisito (requisito_id, lei_id) VALUES ($1, $2)',
                [req.id, parseInt(leiId)]
              );
            }
          }
        }
      }
    }

    // Buscar projeto completo
    const projetoCompleto = await buscarProjetoCompleto(novoProjeto.id);

    res.status(201).json(projetoCompleto);
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

// Função auxiliar para buscar projeto completo
async function buscarProjetoCompleto(projetoId) {
  const projeto = await pool.query(
    'SELECT * FROM projetos WHERE id = $1',
    [projetoId]
  );

  if (projeto.rows.length === 0) return null;

  const temas = await pool.query(
    'SELECT * FROM temas_projeto WHERE projeto_id = $1',
    [projetoId]
  );

  const temasComRequisitos = await Promise.all(
    temas.rows.map(async (tema) => {
      const requisitos = await pool.query(
        'SELECT * FROM requisitos WHERE tema_projeto_id = $1',
        [tema.id]
      );

      const requisitosComLeis = await Promise.all(
        requisitos.rows.map(async (req) => {
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

      return {
        id: tema.id,
        nome: tema.nome,
        requisitos: requisitosComLeis
      };
    })
  );

  return {
    id: projeto.rows[0].id.toString(),
    nome: projeto.rows[0].nome,
    temas: temasComRequisitos
  };
}

// Listar todos os projetos
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projetos ORDER BY created_at DESC'
    );

    const projetos = await Promise.all(
      result.rows.map(p => buscarProjetoCompleto(p.id))
    );

    res.json(projetos);
  } catch (error) {
    console.error('Erro ao listar projetos:', error);
    res.status(500).json({ error: 'Erro ao listar projetos' });
  }
});

// Buscar projeto por ID
router.get("/:id", async (req, res) => {
  try {
    const projeto = await buscarProjetoCompleto(parseInt(req.params.id));
    
    if (!projeto) {
      return res.status(404).json({ error: "Projeto não encontrado" });
    }

    res.json(projeto);
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    res.status(500).json({ error: 'Erro ao buscar projeto' });
  }
});

// Deletar projeto
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM projetos WHERE id = $1 RETURNING *',
      [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Projeto não encontrado" });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    res.status(500).json({ error: 'Erro ao deletar projeto' });
  }
});

export default router;
