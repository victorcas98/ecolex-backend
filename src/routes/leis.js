import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { getTemas, updateTemaVinculacoes, updateTemaLeisVinculacoes } from "./temas.js";

const router = Router();

// Garantir que o diretório uploads existe
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do multer
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
let leis = [];
let requisitos = []; // importado quando necessário

// Criar lei (OBRIGATÓRIO vincular pelo menos um tema)
router.post("/", upload.single("documento"), (req, res) => {
  const { nome, link, temas: temasIds } = req.body;
  const documento = req.file ? req.file.path : null;

  // Validar se pelo menos um tema foi fornecido
  if (!temasIds || !Array.isArray(JSON.parse(temasIds)) || JSON.parse(temasIds).length === 0) {
    return res.status(400).json({ 
      error: "Pelo menos um tema deve ser vinculado à lei" 
    });
  }

  const temasArray = JSON.parse(temasIds);
  const temas = getTemas();

  // Validar se todos os temas existem
  const temasInvalidos = temasArray.filter(id => !temas.find(t => t.id === parseInt(id)));
  if (temasInvalidos.length > 0) {
    return res.status(400).json({ 
      error: `Temas não encontrados: ${temasInvalidos.join(', ')}` 
    });
  }

  const novaLei = {
    id: leis.length + 1,
    nome,
    documento,
    link,
    temas: temasArray.map(id => parseInt(id)) // IDs dos temas vinculados
  };

  leis.push(novaLei);

  // CORREÇÃO: Atualizar vinculações nos temas - converter temaId para inteiro
  temasArray.forEach(temaId => {
    const temaIdInt = parseInt(temaId);
    updateTemaLeisVinculacoes(temaIdInt, novaLei.id);
  });

  // Retornar no formato correto
  const leiFormatada = {
    id: novaLei.id.toString(),
    nome: novaLei.nome,
    link: novaLei.link,
    documento: novaLei.documento,
    temasIds: novaLei.temas.map(id => id.toString())
  };

  res.status(201).json(leiFormatada);
});

// Listar leis com formato correto do fluxograma
router.get("/", (req, res) => {
  const leisFormatadas = leis.map(lei => ({
    id: lei.id.toString(),
    nome: lei.nome,
    link: lei.link,
    documento: lei.documento,
    temasIds: lei.temas ? lei.temas.map(id => id.toString()) : []
  }));
  
  res.json(leisFormatadas);
});

// Buscar lei por ID com formato correto
router.get("/:id", (req, res) => {
  const lei = leis.find((l) => l.id === parseInt(req.params.id));
  if (!lei) return res.status(404).json({ error: "Lei não encontrada" });

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