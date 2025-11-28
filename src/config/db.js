import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Testar conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados PostgreSQL (Neon)');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexão:', err);
  process.exit(-1);
});

export default pool;
