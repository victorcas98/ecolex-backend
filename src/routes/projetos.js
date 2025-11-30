import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
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
    // Verificar se o diretório existe antes de salvar
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

// Buscar projeto por ID
router.get("/:id", (req, res) => {
  const projeto = projetos.find((p) => p.id === parseInt(req.params.id));
  if (!projeto) return res.status(404).json({ error: "Projeto não encontrado" });

  verificarValidadeRequisitos(projeto);
  const projetoFormatado = {
    id: projeto.id.toString(),
    nome: projeto.nome,
    temas: projeto.temas
  };
  res.json(projetoFormatado);
});

// Atualizar projeto completo
router.put("/:id", (req, res) => {
  const projeto = projetos.find((p) => p.id === parseInt(req.params.id));
  if (!projeto) return res.status(404).json({ error: "Projeto não encontrado" });

  const { nome, temas } = req.body;

  // Atualizar nome se fornecido
  if (nome) {
    // Validar duplicidade de nome
    if (nome !== projeto.nome && projetos.some((p) => p.nome === nome)) {
      return res.status(400).json({ error: "Nome de projeto já existe" });
    }
    projeto.nome = nome;
  }

  // Atualizar temas se fornecidos (edição completa)
  if (temas && Array.isArray(temas)) {
    // Validar estrutura dos temas
    const temasValidados = [];
    for (const tema of temas) {
      if (!tema.nome) {
        return res.status(400).json({ error: "Nome do tema é obrigatório" });
      }

      const requisitosValidados = [];
      if (tema.requisitos && Array.isArray(tema.requisitos)) {
        for (const req of tema.requisitos) {
          // Validar campos obrigatórios do requisito
          if (!req.id || !req.nome) {
            return res.status(400).json({ 
              error: "ID e nome do requisito são obrigatórios" 
            });
          }

          // Validar status
          const statusValidos = ['pendente', 'concluido'];
          if (req.status && !statusValidos.includes(req.status)) {
            return res.status(400).json({ 
              error: `Status inválido: ${req.status}. Use: ${statusValidos.join(', ')}` 
            });
          }

          // Validar leisIds se fornecidas
          if (req.leisIds && Array.isArray(req.leisIds)) {
            const leis = getLeis();
            const leisInvalidas = req.leisIds.filter(id => !leis.find(l => l.id.toString() === id));
            if (leisInvalidas.length > 0) {
              return res.status(400).json({ 
                error: `Leis não encontradas: ${leisInvalidas.join(', ')}` 
              });
            }
          }

          // Preservar dados existentes ou usar novos
          const temaExistente = projeto.temas.find(t => t.nome === tema.nome || t.id === tema.id);
          const requisitoExistente = temaExistente?.requisitos.find(r => r.id === req.id);

          const requisitoFormatado = {
            id: req.id,
            nome: req.nome,
            status: req.status !== undefined ? req.status : (requisitoExistente?.status || 'pendente'),
            evidencia: req.evidencia !== undefined ? req.evidencia : (requisitoExistente?.evidencia || ''),
            anexo: req.anexo !== undefined ? req.anexo : (requisitoExistente?.anexo || []),
            leisIds: req.leisIds !== undefined ? req.leisIds : (requisitoExistente?.leisIds || [])
          };

          requisitosValidados.push(requisitoFormatado);
        }
      }

      temasValidados.push({
        id: tema.id || (Date.now() + Math.random()), // Preservar ID existente ou criar novo
        nome: tema.nome,
        requisitos: requisitosValidados
      });
    }

    projeto.temas = temasValidados;
  }

  // Retornar projeto atualizado
  const projetoFormatado = {
    id: projeto.id.toString(),
    nome: projeto.nome,
    temas: projeto.temas
  };

  res.json(projetoFormatado);
});

// Deletar projeto
router.delete("/:id", (req, res) => {
  const projetoId = parseInt(req.params.id);
  projetos = projetos.filter((p) => p.id !== projetoId);
  res.status(204).send();
});

// Vincular tema ao projeto
router.post("/:id/temas", (req, res) => {
  const projeto = projetos.find((p) => p.id === parseInt(req.params.id));
  if (!projeto) return res.status(404).json({ error: "Projeto não encontrado" });

  const { temaId } = req.body;
  
  if (!temaId) {
    return res.status(400).json({ error: "ID do tema é obrigatório" });
  }

  const temas = getTemas();
  const tema = temas.find(t => t.id === parseInt(temaId));
  
  if (!tema) {
    return res.status(400).json({ error: "Tema não encontrado" });
  }

  // Verificar se tema já está vinculado (por nome, já que pode não ter ID ainda)
  if (projeto.temas.some(t => t.nome === tema.nome)) {
    return res.status(400).json({ error: "Tema já vinculado ao projeto" });
  }

  // Criar estrutura do tema no projeto com ID
  const temaProjeto = {
    id: Date.now() + Math.random(), // Gerar ID único para o tema no projeto
    nome: tema.nome,
    requisitos: []
  };

  projeto.temas.push(temaProjeto);

  res.status(201).json({
    id: projeto.id.toString(),
    nome: projeto.nome,
    temas: projeto.temas
  });
});

// Adicionar requisito a um tema do projeto
router.post("/:id/temas/:temaId/requisitos", (req, res) => {
  const projeto = projetos.find((p) => p.id === parseInt(req.params.id));
  if (!projeto) return res.status(404).json({ error: "Projeto não encontrado" });

  const { temaId } = req.params;
  const { nome, status, leisIds } = req.body;

  if (!nome) {
    return res.status(400).json({ error: "Nome do requisito é obrigatório" });
  }

  const tema = projeto.temas.find(t => t.id == temaId);
  if (!tema) {
    return res.status(404).json({ error: "Tema não encontrado no projeto" });
  }

  // Verificar se requisito já existe no tema
  if (tema.requisitos.some(r => r.nome === nome)) {
    return res.status(400).json({ error: "Requisito já existe neste tema" });
  }

  // Validar status
  const statusValidos = ['pendente', 'concluido'];
  if (status && !statusValidos.includes(status)) {
    return res.status(400).json({ 
      error: `Status inválido. Use: ${statusValidos.join(', ')}` 
    });
  }

  // Validar leisIds se fornecidas
  if (leisIds && Array.isArray(leisIds)) {
    const leis = getLeis();
    const leisInvalidas = leisIds.filter(id => !leis.find(l => l.id === parseInt(id)));
    if (leisInvalidas.length > 0) {
      return res.status(400).json({ 
        error: `Leis não encontradas: ${leisInvalidas.join(', ')}` 
      });
    }
  }

  const novoRequisito = {
    id: `req-${Date.now()}`, // Gerar ID único
    nome,
    status: status || 'pendente',
    evidencia: '', // String simples
    anexo: [], // Array de anexos
    leisIds: leisIds ? leisIds.map(id => parseInt(id)) : [],
    dataValidade: new Date().toISOString() // Adiciona data atual como validade
  };

  tema.requisitos.push(novoRequisito);

  res.status(201).json({
    id: projeto.id.toString(),
    nome: projeto.nome,
    temas: projeto.temas
  });
});

// Adicionar evidência a um requisito
router.post("/:id/temas/:temaId/requisitos/:requisitoId/evidencias", upload.single("anexo"), (req, res) => {
  const projeto = projetos.find((p) => p.id === parseInt(req.params.id));
  if (!projeto) return res.status(404).json({ error: "Projeto não encontrado" });

  const { temaId, requisitoId } = req.params;
  const { registro, dataValidade } = req.body;
  const anexo = req.file ? req.file.path : null;

  if (!registro) {
    return res.status(400).json({ error: "Registro da evidência é obrigatório" });
  }

  const tema = projeto.temas.find(t => t.id == temaId);
  if (!tema) {
    return res.status(404).json({ error: "Tema não encontrado no projeto" });
  }

  const requisito = tema.requisitos.find(r => r.id === requisitoId);
  if (!requisito) {
    return res.status(404).json({ error: "Requisito não encontrado no tema" });
  }

  // Sobrescrever a evidência com o novo registro (não concatenar)
  requisito.evidencia = registro;

  // Atualizar data de validade se fornecida
  if (dataValidade) {
    requisito.dataValidade = dataValidade;
  }

  // Adicionar anexo ao array de anexos se fornecido
  if (anexo) {
    requisito.anexo.push({
      nome: req.file.originalname,
      caminho: anexo,
      data: new Date().toISOString()
    });
  }

  res.status(201).json({
    id: projeto.id.toString(),
    nome: projeto.nome,
    temas: projeto.temas
  });
});

// Atualizar status de um requisito
router.put("/:id/temas/:temaId/requisitos/:requisitoId", (req, res) => {
  const projeto = projetos.find((p) => p.id === parseInt(req.params.id));
  if (!projeto) return res.status(404).json({ error: "Projeto não encontrado" });

  const { temaId, requisitoId } = req.params;
  const { status, leisIds, dataValidade } = req.body;

  const tema = projeto.temas.find(t => t.id == temaId);
  if (!tema) {
    return res.status(404).json({ error: "Tema não encontrado no projeto" });
  }

  const requisito = tema.requisitos.find(r => r.id === requisitoId);
  if (!requisito) {
    return res.status(404).json({ error: "Requisito não encontrado no tema" });
  }

  // Validar status se fornecido
  if (status) {
    const statusValidos = ['pendente', 'concluido'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ 
        error: `Status inválido. Use: ${statusValidos.join(', ')}` 
      });
    }
    requisito.status = status;
  }

  // Atualizar leisIds se fornecidas
  if (leisIds && Array.isArray(leisIds)) {
    const leis = getLeis();
    const leisInvalidas = leisIds.filter(id => !leis.find(l => l.id === parseInt(id)));
    if (leisInvalidas.length > 0) {
      return res.status(400).json({ 
        error: `Leis não encontradas: ${leisInvalidas.join(', ')}` 
      });
    }
    requisito.leisIds = leisIds.map(id => parseInt(id));
  }

  if (dataValidade) {
    requisito.dataValidade = dataValidade;
  }

  res.json({
    id: projeto.id.toString(),
    nome: projeto.nome,
    temas: projeto.temas
  });
});

// Atualizar evidência de um requisito específico
router.put("/:id/temas/:temaId/requisitos/:requisitoId/evidencia", (req, res) => {
  const projeto = projetos.find((p) => p.id === parseInt(req.params.id));
  if (!projeto) return res.status(404).json({ error: "Projeto não encontrado" });

  const { temaId, requisitoId } = req.params;
  const { evidencia } = req.body;

  const tema = projeto.temas.find(t => t.id == temaId);
  if (!tema) {
    return res.status(404).json({ error: "Tema não encontrado no projeto" });
  }

  const requisito = tema.requisitos.find(r => r.id === requisitoId);
  if (!requisito) {
    return res.status(404).json({ error: "Requisito não encontrado no tema" });
  }

  requisito.evidencia = evidencia || '';

  res.json({
    id: projeto.id.toString(),
    nome: projeto.nome,
    temas: projeto.temas
  });
});

// Upload de anexos para requisito específico
router.post("/:id/temas/:temaId/requisitos/:requisitoId/anexos", upload.array("anexos", 3), (req, res) => {
  const projeto = projetos.find((p) => p.id === parseInt(req.params.id));
  if (!projeto) return res.status(404).json({ error: "Projeto não encontrado" });

  const { temaId, requisitoId } = req.params;
  const anexos = req.files || [];

  const tema = projeto.temas.find(t => t.id == temaId);
  if (!tema) {
    return res.status(404).json({ error: "Tema não encontrado no projeto" });
  }

  const requisito = tema.requisitos.find(r => r.id === requisitoId);
  if (!requisito) {
    return res.status(404).json({ error: "Requisito não encontrado no tema" });
  }

  // Verificar limite de 3 anexos
  if (requisito.anexo.length + anexos.length > 3) {
    return res.status(400).json({ 
      error: "Máximo de 3 anexos por requisito" 
    });
  }

  // Adicionar novos anexos
  const novosAnexos = anexos.map(arquivo => ({
    nome: arquivo.originalname,
    caminho: arquivo.path,
    data: new Date().toISOString()
  }));

  requisito.anexo.push(...novosAnexos);

  res.json({
    id: projeto.id.toString(),
    nome: projeto.nome,
    temas: projeto.temas
  });
});

// Download de anexo específico
router.get("/:id/temas/:temaId/requisitos/:requisitoId/anexos/:anexoIndex/download", (req, res) => {
  const projeto = projetos.find((p) => p.id === parseInt(req.params.id));
  if (!projeto) return res.status(404).json({ error: "Projeto não encontrado" });

  const { temaId, requisitoId, anexoIndex } = req.params;

  const tema = projeto.temas.find(t => t.id == temaId);
  if (!tema) {
    return res.status(404).json({ error: "Tema não encontrado no projeto" });
  }

  const requisito = tema.requisitos.find(r => r.id === requisitoId);
  if (!requisito) {
    return res.status(404).json({ error: "Requisito não encontrado no tema" });
  }

  const anexo = requisito.anexo[parseInt(anexoIndex)];
  if (!anexo) {
    return res.status(404).json({ error: "Anexo não encontrado" });
  }

  // Retornar o caminho completo para download
  res.json({
    nome: anexo.nome,
    url: `http://localhost:3000/${anexo.caminho}`,
    caminho: anexo.caminho,
    data: anexo.data
  });
});

// Função exportada para obter projetos (usada por outros módulos)
export const getProjetos = () => projetos;

export default router;
