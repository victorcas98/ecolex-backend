-- Migration para atualizar schema do banco de dados
-- Execute este script no Render para atualizar a estrutura

-- 1. Criar tabelas novas se não existirem
CREATE TABLE IF NOT EXISTS projetos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS temas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS temas_projeto (
  id SERIAL PRIMARY KEY,
  projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
  tema_id NUMERIC NOT NULL,
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leis (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  link TEXT,
  documento TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leis_temas (
  lei_id INTEGER REFERENCES leis(id) ON DELETE CASCADE,
  tema_id INTEGER REFERENCES temas(id) ON DELETE CASCADE,
  PRIMARY KEY (lei_id, tema_id)
);

-- 2. Backup da tabela requisitos antiga (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'requisitos') THEN
    -- Se a tabela antiga existe, renomeia
    ALTER TABLE IF EXISTS requisitos RENAME TO requisitos_old_backup;
  END IF;
END $$;

-- 3. Criar nova tabela requisitos com estrutura correta
CREATE TABLE IF NOT EXISTS requisitos (
  id VARCHAR(50) PRIMARY KEY,
  tema_projeto_id INTEGER REFERENCES temas_projeto(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
  evidencia TEXT DEFAULT '',
  data_validade TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Criar tabela de anexos
CREATE TABLE IF NOT EXISTS anexos (
  id SERIAL PRIMARY KEY,
  requisito_id VARCHAR(50) REFERENCES requisitos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  caminho TEXT NOT NULL,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Criar tabela de relação leis-requisitos
CREATE TABLE IF NOT EXISTS leis_requisito (
  requisito_id VARCHAR(50) REFERENCES requisitos(id) ON DELETE CASCADE,
  lei_id INTEGER NOT NULL,
  PRIMARY KEY (requisito_id, lei_id)
);

-- 6. Criar índices
CREATE INDEX IF NOT EXISTS idx_temas_projeto_projeto_id ON temas_projeto(projeto_id);
CREATE INDEX IF NOT EXISTS idx_requisitos_tema_projeto_id ON requisitos(tema_projeto_id);
CREATE INDEX IF NOT EXISTS idx_anexos_requisito_id ON anexos(requisito_id);
CREATE INDEX IF NOT EXISTS idx_leis_requisito_requisito_id ON leis_requisito(requisito_id);
CREATE INDEX IF NOT EXISTS idx_leis_temas_lei_id ON leis_temas(lei_id);
CREATE INDEX IF NOT EXISTS idx_leis_temas_tema_id ON leis_temas(tema_id);

-- 7. Mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE 'Migration concluída! A tabela antiga foi renomeada para requisitos_old_backup se você precisar dos dados.';
END $$;
