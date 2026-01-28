/**
 * Script para verificar se a infraestrutura está rodando
 * Verifica: Postgres, Redis, Supabase
 * Executa: node scripts/check-infra.js
 */

import pg from 'pg';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

console.log(`${colors.blue}========================================${colors.reset}`);
console.log(`${colors.blue}   Verificação de Infraestrutura${colors.reset}`);
console.log(`${colors.blue}========================================${colors.reset}\n`);

let allOk = true;

// ============================================
// 1. VERIFICAR POSTGRES
// ============================================
async function checkPostgres() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.log(`${colors.red}✗ PostgreSQL${colors.reset} - DATABASE_URL não configurado`);
    return false;
  }

  const client = new pg.Client({ connectionString: dbUrl });

  try {
    await client.connect();
    const result = await client.query('SELECT version()');
    const version = result.rows[0].version.split(' ')[1];
    console.log(`${colors.green}✓ PostgreSQL${colors.reset} - Conectado (v${version})`);
    await client.end();
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ PostgreSQL${colors.reset} - ${error.message}`);
    return false;
  }
}

// ============================================
// 2. VERIFICAR REDIS
// ============================================
async function checkRedis() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.log(`${colors.red}✗ Redis${colors.reset} - REDIS_URL não configurado`);
    return false;
  }

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });

  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      const info = await redis.info('server');
      const versionLine = info.split('\n').find(l => l.startsWith('redis_version:'));
      const version = versionLine ? versionLine.split(':')[1].trim() : 'unknown';
      console.log(`${colors.green}✓ Redis${colors.reset} - Conectado (v${version})`);
      await redis.quit();
      return true;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Redis${colors.reset} - ${error.message}`);
    await redis.quit();
    return false;
  }
}

// ============================================
// 3. VERIFICAR SUPABASE (URL válido)
// ============================================
async function checkSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.log(`${colors.red}✗ Supabase${colors.reset} - SUPABASE_URL ou SERVICE_ROLE_KEY não configurado`);
    return false;
  }

  // Verificar se não é placeholder
  if (supabaseUrl.includes('your-project')) {
    console.log(`${colors.yellow}⚠ Supabase${colors.reset} - URL é placeholder (substitua por projeto real)`);
    return false;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });

    if (response.ok || response.status === 404) {
      // 404 é ok (endpoint raiz não existe, mas Supabase está acessível)
      console.log(`${colors.green}✓ Supabase${colors.reset} - API acessível`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠ Supabase${colors.reset} - Status ${response.status} (verifique credenciais)`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Supabase${colors.reset} - ${error.message}`);
    return false;
  }
}

// ============================================
// EXECUTAR VERIFICAÇÕES
// ============================================
async function main() {
  const postgresOk = await checkPostgres();
  const redisOk = await checkRedis();
  const supabaseOk = await checkSupabase();

  allOk = postgresOk && redisOk && supabaseOk;

  console.log(`\n${colors.blue}========================================${colors.reset}`);

  if (allOk) {
    console.log(`${colors.green}✅ Toda a infraestrutura está OK!${colors.reset}\n`);
    console.log(`${colors.blue}Próximos passos:${colors.reset}`);
    console.log(`1. Validar .env: ${colors.green}node scripts/validate-env.js${colors.reset}`);
    console.log(`2. Aplicar migrations: ${colors.green}npm run db:push${colors.reset}`);
    console.log(`3. Executar seed: ${colors.green}node scripts/run-seed.js${colors.reset}`);
    console.log(`4. Iniciar API: ${colors.green}npm run dev:api${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Alguns serviços não estão acessíveis${colors.reset}\n`);

    if (!postgresOk) {
      console.log(`${colors.yellow}PostgreSQL:${colors.reset}`);
      console.log(`  - Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15`);
      console.log(`  - Cloud: Supabase, Neon, Railway, etc.`);
    }

    if (!redisOk) {
      console.log(`\n${colors.yellow}Redis:${colors.reset}`);
      console.log(`  - Docker: docker run -d -p 6379:6379 redis:7-alpine`);
      console.log(`  - Cloud: Upstash, Redis Cloud, etc.`);
    }

    if (!supabaseOk) {
      console.log(`\n${colors.yellow}Supabase:${colors.reset}`);
      console.log(`  - Criar projeto em: https://supabase.com/dashboard`);
      console.log(`  - Obter credenciais em: Settings > API`);
    }

    console.log();
    process.exit(1);
  }
}

main();
