CREATE TABLE IF NOT EXISTS projetos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  responsavel VARCHAR(255),
  data_criacao TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leis (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  origem TEXT,
  categoria VARCHAR(100),
  data_publicacao DATE
);

CREATE TABLE IF NOT EXISTS requisitos (
  id SERIAL PRIMARY KEY,
  lei_id INT REFERENCES leis(id),
  pergunta TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conformidades (
  id SERIAL PRIMARY KEY,
  projeto_id INT REFERENCES projetos(id),
  requisito_id INT REFERENCES requisitos(id),
  atendido BOOLEAN DEFAULT FALSE
);
