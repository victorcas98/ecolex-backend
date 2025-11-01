import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { getTemas } from "./temas.js";
import { getLeis } from "./leis.js";

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

// "Banco" em memória
let projetos = [];

// Função para verificar validade dos requisitos e atualizar status
function verificarValidadeRequisitos(projeto) {
  const hoje = new Date();
  projeto.temas.forEach(tema => {
    tema.requisitos.forEach(requisito => {
      if (requisito.dataValidade) {
        const validade = new Date(requisito.dataValidade);
        if (hoje >= validade && requisito.status === 'concluido') {
          requisito.status = 'pendente';
        }
      }
    });
  });
}

// Criar projeto completo
router.post("/", (req, res) => {
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

  // Impedir duplicidade de nome
  if (projetos.some((p) => p.nome === nome)) {
    return res.status(400).json({ error: "Nome de projeto já existe" });
  }

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

        // Estrutura do requisito compatível
        const requisitoFormatado = {
          id: req.id,
          nome: req.nome,
          status: req.status || 'pendente',
          evidencia: req.evidencia || '', // String simples como no frontend
          anexo: req.anexo || [], // Array de anexos
          leisIds: req.leisIds || []
        };

        requisitosValidados.push(requisitoFormatado);
      }
    }

    temasValidados.push({
      id: Date.now() + Math.random(), // ID único para o tema no projeto
      nome: tema.nome,
      requisitos: requisitosValidados
    });
  }

  const novoProjeto = {
    id: projetos.length + 1,
    nome,
    temas: temasValidados
  };

  projetos.push(novoProjeto);

  // Retornar no formato correto
  const projetoFormatado = {
    id: novoProjeto.id.toString(),
    nome: novoProjeto.nome,
    temas: novoProjeto.temas
  };

  res.status(201).json(projetoFormatado);
});

// Listar todos os projetos
router.get("/", (req, res) => {
  projetos.forEach(verificarValidadeRequisitos);
  const projetosFormatados = projetos.map(projeto => ({
    id: projeto.id.toString(),
    nome: projeto.nome,
    temas: projeto.temas
  }));
  
  res.json(projetosFormatados);
});

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
