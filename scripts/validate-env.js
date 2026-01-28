/**
 * Script de validação de variáveis de ambiente
 * Executa: node scripts/validate-env.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
dotenv.config({ path: join(__dirname, '../.env') });

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Variáveis CRÍTICAS (bloqueiam boot)
const REQUIRED_VARS = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'APP_JWT_SECRET',
  'WEB_ORIGIN',
  'ALLOWED_ORIGINS',
];

// Variáveis OPCIONAIS (mas recomendadas)
const OPTIONAL_VARS = [
  'EVOLUTION_API_URL',
  'EVOLUTION_API_KEY',
  'EVOLUTION_WEBHOOK_SECRET',
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_APP_SECRET',
];

console.log(`${colors.blue}========================================${colors.reset}`);
console.log(`${colors.blue}   Validação de Variáveis de Ambiente${colors.reset}`);
console.log(`${colors.blue}========================================${colors.reset}\n`);

// Verificar variáveis obrigatórias
const missing = [];
const invalid = [];

REQUIRED_VARS.forEach((varName) => {
  const value = process.env[varName];

  if (!value) {
    missing.push(varName);
    console.log(`${colors.red}✗ ${varName}${colors.reset} - FALTANDO`);
  } else if (value.includes('your_') || value.includes('here')) {
    invalid.push(varName);
    console.log(`${colors.yellow}⚠ ${varName}${colors.reset} - VALOR PLACEHOLDER (substitua)`);
  } else {
    console.log(`${colors.green}✓ ${varName}${colors.reset}`);
  }
});

// Validações específicas
console.log(`\n${colors.blue}Validações Específicas:${colors.reset}`);

// APP_JWT_SECRET deve ter pelo menos 32 caracteres
const jwtSecret = process.env.APP_JWT_SECRET;
if (jwtSecret && jwtSecret.length < 32) {
  console.log(`${colors.yellow}⚠ APP_JWT_SECRET deve ter pelo menos 32 caracteres (atual: ${jwtSecret.length})${colors.reset}`);
  invalid.push('APP_JWT_SECRET (comprimento insuficiente)');
} else if (jwtSecret) {
  console.log(`${colors.green}✓ APP_JWT_SECRET tem ${jwtSecret.length} caracteres${colors.reset}`);
}

// DATABASE_URL deve ter formato válido
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && !dbUrl.startsWith('postgresql://')) {
  console.log(`${colors.yellow}⚠ DATABASE_URL deve começar com 'postgresql://'${colors.reset}`);
  invalid.push('DATABASE_URL (formato inválido)');
} else if (dbUrl) {
  console.log(`${colors.green}✓ DATABASE_URL tem formato válido${colors.reset}`);
}

// REDIS_URL deve ter formato válido
const redisUrl = process.env.REDIS_URL;
if (redisUrl && !redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
  console.log(`${colors.yellow}⚠ REDIS_URL deve começar com 'redis://' ou 'rediss://'${colors.reset}`);
  invalid.push('REDIS_URL (formato inválido)');
} else if (redisUrl) {
  console.log(`${colors.green}✓ REDIS_URL tem formato válido${colors.reset}`);
}

// Variáveis opcionais
console.log(`\n${colors.blue}Variáveis Opcionais:${colors.reset}`);
OPTIONAL_VARS.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`${colors.yellow}○ ${varName}${colors.reset} - não configurado (opcional)`);
  } else {
    console.log(`${colors.green}✓ ${varName}${colors.reset}`);
  }
});

// Resultado final
console.log(`\n${colors.blue}========================================${colors.reset}`);
if (missing.length === 0 && invalid.length === 0) {
  console.log(`${colors.green}✅ Todas as variáveis críticas configuradas!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Configuração incompleta ou inválida${colors.reset}\n`);

  if (missing.length > 0) {
    console.log(`${colors.red}Variáveis faltando (${missing.length}):${colors.reset}`);
    missing.forEach((v) => console.log(`  - ${v}`));
  }

  if (invalid.length > 0) {
    console.log(`\n${colors.yellow}Variáveis com valores inválidos (${invalid.length}):${colors.reset}`);
    invalid.forEach((v) => console.log(`  - ${v}`));
  }

  console.log(`\n${colors.blue}Como corrigir:${colors.reset}`);
  console.log(`1. Copie .env.example para .env: ${colors.green}cp .env.example .env${colors.reset}`);
  console.log(`2. Edite .env e substitua os valores placeholder`);
  console.log(`3. Execute novamente: ${colors.green}node scripts/validate-env.js${colors.reset}\n`);

  process.exit(1);
}
