import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('');
  console.log('========================================');
  console.log('🚀 INICIANDO MIGRATION DO BANCO DE DADOS');
  console.log('========================================');
  console.log('');

  try {
    // Lê o arquivo de migration
    const migrationPath = path.join(__dirname, '../migrations/001_update_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Arquivo de migration não encontrado: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Arquivo de migration carregado:', migrationPath);
    console.log('📊 Tamanho do script:', sql.length, 'caracteres');
    console.log('');
    console.log('⏳ Executando migration...');
    console.log('');

    // Executa o SQL
    await pool.query(sql);

    console.log('');
    console.log('========================================');
    console.log('✅ MIGRATION EXECUTADA COM SUCESSO!');
    console.log('========================================');
    console.log('');
    console.log('O schema do banco de dados foi atualizado.');
    console.log('Todas as tabelas foram criadas/atualizadas.');
    console.log('');

    // Verifica as tabelas criadas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 Tabelas no banco de dados:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    console.log('');

    process.exit(0);
  } catch (error) {
    console.log('');
    console.log('========================================');
    console.log('❌ ERRO AO EXECUTAR MIGRATION');
    console.log('========================================');
    console.log('');
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.log('');
    console.log('========================================');
    console.log('');
    process.exit(1);
  }
}

runMigration();
