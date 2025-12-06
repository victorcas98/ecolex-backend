import pg from "pg";
const { Pool } = pg;

// Validação crítica da DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('');
  console.error('========================================')
  console.error('❌ ERRO CRÍTICO: DATABASE_URL não definida!');
  console.error('========================================')
  console.error('Configure a variável de ambiente DATABASE_URL no arquivo .env');
  console.error('Exemplo para Neon:');
  console.error('DATABASE_URL=postgresql://user:password@your-db.neon.tech/dbname?sslmode=require');
  console.error('');
  process.exit(1);
}

// Configuração SSL: Neon requer SSL, Docker local não
const isNeon = process.env.DATABASE_URL.includes('neon.tech');
const isProduction = process.env.NODE_ENV === 'production';
const requireSSL = isNeon || isProduction;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: requireSSL ? { rejectUnauthorized: false } : false,
});

// 🔍 Teste de conexão detalhado ao iniciar
pool.query('SELECT current_database(), version(), inet_server_addr() as server_ip, current_user')
  .then(result => {
    console.log('');
    console.log('========================================');
    console.log('✅ CONECTADO AO BANCO DE DADOS!');
    console.log('========================================');
    console.log('📦 Database:', result.rows[0].current_database);
    console.log('👤 Usuário:', result.rows[0].current_user);
    console.log('🔧 PostgreSQL:', result.rows[0].version.split(' ')[1]);
    console.log('🌐 Server IP:', result.rows[0].server_ip || 'N/A');
    console.log('🔗 Host:', pool.options.host || 'extraído da connection string');
    
    // Mostra se está conectado no Neon
    if (process.env.DATABASE_URL?.includes('neon.tech')) {
      console.log('☁️  PROVEDOR: NEON (cloud)');
    } else if (process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('db:5432')) {
      console.log('🐳 PROVEDOR: Docker local');
    } else {
      console.log('🔍 PROVEDOR: Outro');
    }
    
    console.log('========================================');
    console.log('');
  })
  .catch(err => {
    console.log('');
    console.log('========================================');
    console.log('❌ ERRO AO CONECTAR NO BANCO!');
    console.log('========================================');
    console.log('Mensagem:', err.message);
    console.log('Code:', err.code);
    console.log('DATABASE_URL definida?', !!process.env.DATABASE_URL);
    console.log('========================================');
    console.log('');
  });

export default pool;