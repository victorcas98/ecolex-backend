-- Script para resetar e recriar o schema completo
-- ATENÇÃO: Isso vai APAGAR TODOS OS DADOS do banco!

-- 1. Dropar todas as tabelas na ordem correta (respeitando foreign keys)
DROP TABLE IF EXISTS leis_requisito CASCADE;
DROP TABLE IF EXISTS anexos CASCADE;
DROP TABLE IF EXISTS requisitos CASCADE;
DROP TABLE IF EXISTS leis_temas CASCADE;
DROP TABLE IF EXISTS temas_projeto CASCADE;
DROP TABLE IF EXISTS conformidades CASCADE;
DROP TABLE IF EXISTS leis CASCADE;
DROP TABLE IF EXISTS temas CASCADE;
DROP TABLE IF EXISTS projetos CASCADE;

-- 2. Recriar tudo do zero usando o schema.sql
-- Tabela de projetos
CREATE TABLE projetos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de temas dentro de projetos
CREATE TABLE temas_projeto (
  id SERIAL PRIMARY KEY,
  projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
  tema_id NUMERIC NOT NULL,
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de requisitos
CREATE TABLE requisitos (
  id VARCHAR(50) PRIMARY KEY,
  tema_projeto_id INTEGER REFERENCES temas_projeto(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
  evidencia TEXT DEFAULT '',
  data_validade TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de anexos de requisitos
CREATE TABLE anexos (
  id SERIAL PRIMARY KEY,
  requisito_id VARCHAR(50) REFERENCES requisitos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  caminho TEXT NOT NULL,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de leis vinculadas a requisitos
CREATE TABLE leis_requisito (
  requisito_id VARCHAR(50) REFERENCES requisitos(id) ON DELETE CASCADE,
  lei_id INTEGER NOT NULL,
  PRIMARY KEY (requisito_id, lei_id)
);

-- Tabela de leis (standalone)
CREATE TABLE leis (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  link TEXT,
  documento TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de temas (standalone)
CREATE TABLE temas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relação leis-temas
CREATE TABLE leis_temas (
  lei_id INTEGER REFERENCES leis(id) ON DELETE CASCADE,
  tema_id INTEGER REFERENCES temas(id) ON DELETE CASCADE,
  PRIMARY KEY (lei_id, tema_id)
);

-- Índices para melhorar performance
CREATE INDEX idx_temas_projeto_projeto_id ON temas_projeto(projeto_id);
CREATE INDEX idx_requisitos_tema_projeto_id ON requisitos(tema_projeto_id);
CREATE INDEX idx_anexos_requisito_id ON anexos(requisito_id);
CREATE INDEX idx_leis_requisito_requisito_id ON leis_requisito(requisito_id);
CREATE INDEX idx_leis_temas_lei_id ON leis_temas(lei_id);
CREATE INDEX idx_leis_temas_tema_id ON leis_temas(tema_id);

-- Comentários nas tabelas
COMMENT ON TABLE projetos IS 'Tabela principal de projetos do sistema';
COMMENT ON TABLE temas_projeto IS 'Temas vinculados a projetos específicos';
COMMENT ON TABLE requisitos IS 'Requisitos vinculados a temas de projetos';
COMMENT ON TABLE anexos IS 'Anexos/evidências de requisitos';
COMMENT ON TABLE leis IS 'Leis cadastradas no sistema';
COMMENT ON TABLE temas IS 'Temas standalone do sistema';
