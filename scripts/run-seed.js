/**
 * Script para executar seed SQL no banco
 * Executa: node scripts/run-seed.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
dotenv.config({ path: join(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

async function runSeed() {
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}   Executando Seed do Banco de Dados${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);

  // Verificar DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error(`${colors.red}❌ DATABASE_URL não configurado no .env${colors.reset}`);
    process.exit(1);
  }

  // Ler arquivo SQL
  const sqlPath = join(__dirname, 'seed.sql');
  let sql;
  try {
    sql = readFileSync(sqlPath, 'utf-8');
    console.log(`${colors.green}✓ Arquivo seed.sql lido com sucesso${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Erro ao ler seed.sql: ${error.message}${colors.reset}`);
    process.exit(1);
  }

  // Verificar se user_id foi substituído
  if (sql.includes('SEU_USER_ID_AQUI')) {
    console.log(`\n${colors.yellow}⚠️  ATENÇÃO: SEU_USER_ID_AQUI ainda não foi substituído!${colors.reset}`);
    console.log(`\n${colors.blue}Como obter o user_id:${colors.reset}`);
    console.log(`1. Acesse: Supabase Dashboard > Authentication > Users`);
    console.log(`2. Copie o UUID do usuário (coluna 'UID')`);
    console.log(`3. Edite scripts/seed.sql e substitua 'SEU_USER_ID_AQUI' pelo UUID`);
    console.log(`4. Execute novamente: ${colors.green}node scripts/run-seed.js${colors.reset}\n`);
    process.exit(1);
  }

  // Conectar ao banco
  const client = new pg.Client({ connectionString: dbUrl });

  try {
    console.log(`\n${colors.blue}Conectando ao banco...${colors.reset}`);
    await client.connect();
    console.log(`${colors.green}✓ Conectado ao PostgreSQL${colors.reset}`);

    // Executar seed (split por linha para evitar problemas com comentários)
    const lines = sql.split('\n');
    const statements = [];
    let currentStatement = '';

    for (const line of lines) {
      const trimmed = line.trim();

      // Ignorar comentários e linhas vazias
      if (trimmed.startsWith('--') || trimmed === '') {
        continue;
      }

      currentStatement += line + '\n';

      // Se termina com ;, é fim de statement
      if (trimmed.endsWith(';')) {
        statements.push(currentStatement);
        currentStatement = '';
      }
    }

    console.log(`\n${colors.blue}Executando ${statements.length} comandos SQL...${colors.reset}\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      try {
        const result = await client.query(stmt);

        // Se for SELECT, mostrar resultados
        if (stmt.toUpperCase().startsWith('SELECT')) {
          console.log(`${colors.green}✓ Query ${i + 1}: SELECT executado${colors.reset}`);
          if (result.rows.length > 0) {
            console.log(`${colors.blue}Resultados:${colors.reset}`);
            console.table(result.rows);
          } else {
            console.log(`${colors.yellow}  Nenhum resultado retornado${colors.reset}`);
          }
        } else {
          console.log(`${colors.green}✓ Statement ${i + 1} executado com sucesso${colors.reset}`);
        }
      } catch (error) {
        // ON CONFLICT pode retornar 0 linhas afetadas (não é erro)
        if (stmt.includes('ON CONFLICT') && error.message.includes('duplicate')) {
          console.log(`${colors.yellow}⚠ Statement ${i + 1}: Registro já existe (ON CONFLICT)${colors.reset}`);
        } else {
          console.error(`${colors.red}❌ Erro no statement ${i + 1}:${colors.reset}`, error.message);
          throw error;
        }
      }
    }

    console.log(`\n${colors.green}========================================${colors.reset}`);
    console.log(`${colors.green}✅ Seed executado com sucesso!${colors.reset}`);
    console.log(`${colors.green}========================================${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Erro ao executar seed:${colors.reset}`, error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
