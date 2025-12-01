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

// Salvar evidência (com upload de arquivos)
router.post("/:projetoId/temas/:temaId/requisitos/:requisitoId/evidencias", upload.array("anexo", 3), async (req, res) => {
  try {
    const { projetoId, temaId, requisitoId } = req.params;
    const { registro, dataValidade } = req.body;

    // Atualizar requisito com evidência
    const result = await pool.query(
      'UPDATE requisitos SET evidencia = $1, data_validade = $2 WHERE id = $3 AND tema_projeto_id = $4 RETURNING *',
      [registro, dataValidade || null, requisitoId, parseInt(temaId)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Requisito não encontrado" });
    }

    // Salvar anexos
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await pool.query(
          'INSERT INTO anexos (requisito_id, nome, caminho) VALUES ($1, $2, $3)',
          [requisitoId, file.originalname, file.path]
        );
      }
    }

    res.json({ message: "Evidência salva com sucesso" });
  } catch (error) {
    console.error('Erro ao salvar evidência:', error);
    res.status(500).json({ error: 'Erro ao salvar evidência' });
  }
});

// Atualizar requisito do projeto
router.put("/:projetoId/temas/:temaId/requisitos/:requisitoId", async (req, res) => {
  try {
    const { requisitoId, temaId } = req.params;
    const { status, leisIds, dataValidade } = req.body;

    // Atualizar requisito
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (dataValidade !== undefined) {
      updates.push(`data_validade = $${paramCount++}`);
      values.push(dataValidade);
    }

    if (updates.length > 0) {
      values.push(requisitoId, parseInt(temaId));
      await pool.query(
        `UPDATE requisitos SET ${updates.join(', ')} WHERE id = $${paramCount} AND tema_projeto_id = $${paramCount + 1}`,
        values
      );
    }

    // Atualizar leis vinculadas
    if (leisIds && Array.isArray(leisIds)) {
      // Remover vinculações antigas
      await pool.query('DELETE FROM leis_requisito WHERE requisito_id = $1', [requisitoId]);

      // Adicionar novas
      for (const leiId of leisIds) {
        await pool.query(
          'INSERT INTO leis_requisito (requisito_id, lei_id) VALUES ($1, $2)',
          [requisitoId, parseInt(leiId)]
        );
      }
    }

    res.json({ message: "Requisito atualizado com sucesso" });
  } catch (error) {
    console.error('Erro ao atualizar requisito:', error);
    res.status(500).json({ error: 'Erro ao atualizar requisito' });
  }
});

// Remover requisito do projeto
router.delete("/:projetoId/temas/:temaId/requisitos/:requisitoId", async (req, res) => {
  try {
    const { requisitoId, temaId } = req.params;

    const result = await pool.query(
      'DELETE FROM requisitos WHERE id = $1 AND tema_projeto_id = $2 RETURNING *',
      [requisitoId, parseInt(temaId)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Requisito não encontrado" });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover requisito:', error);
    res.status(500).json({ error: 'Erro ao remover requisito' });
  }
});

export default router;
