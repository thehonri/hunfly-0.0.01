-- ============================================
-- Hunfly - Script de Seed Inicial
-- ============================================
-- Este script cria os dados mínimos necessários para rodar o sistema:
-- 1. Tenant demo
-- 2. Tenant member (admin)
-- 3. WhatsApp account
--
-- IMPORTANTE: Substitua '27c8f131-a3c6-42b9-809a-95c0fe5a5b98' pelo user_id do Supabase
-- Obter em: Supabase Dashboard > Authentication > Users

-- ============================================
-- 1. CRIAR TENANT DEMO
-- ============================================
INSERT INTO tenants (id, name, slug, status, plan, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Company',
  'demo',
  'active',
  'pro',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CRIAR TENANT MEMBER (ADMIN)
-- ============================================
-- ⚠️ ATENÇÃO: SUBSTITUA '27c8f131-a3c6-42b9-809a-95c0fe5a5b98' ABAIXO!
-- O user_id deve vir do Supabase Auth (UUID do usuário autenticado)
-- Obter em: Supabase Dashboard > Authentication > Users

INSERT INTO tenant_members (
  id,
  tenant_id,
  user_id,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '27c8f131-a3c6-42b9-809a-95c0fe5a5b98',
  'tenant_admin',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. CRIAR WHATSAPP ACCOUNT DEMO
-- ============================================
-- NOTA: 'instance_id' deve corresponder ao instanceId do Evolution API
-- ou phoneNumberId do Cloud API. Use 'demo-instance' para testes.

INSERT INTO whatsapp_accounts (
  id,
  tenant_id,
  owner_member_id,
  instance_id,
  provider,
  phone_number,
  display_name,
  status,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'demo-instance',  -- ⚠️ OPCIONAL: Substituir pelo instanceId real do Evolution
  'evolution',
  '5548999999999',
  'Demo WhatsApp',
  'connected',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute este SELECT para validar que os dados foram criados:

SELECT
  t.name AS tenant,
  t.status AS tenant_status,
  tm.user_id,
  tm.role,
  wa.phone_number,
  wa.instance_id,
  wa.status AS account_status
FROM tenants t
JOIN tenant_members tm ON t.id = tm.tenant_id
LEFT JOIN whatsapp_accounts wa ON t.id = wa.tenant_id
WHERE t.id = '00000000-0000-0000-0000-000000000001';

-- Esperado: 1 linha retornada com os dados do tenant, member e account

-- ============================================
-- COMO EXECUTAR
-- ============================================
-- Opção 1 - Via psql:
--   psql "$DATABASE_URL" < scripts/seed.sql
--
-- Opção 2 - Supabase SQL Editor:
--   1. Acesse: Supabase Dashboard > SQL Editor
--   2. Cole o conteúdo deste arquivo
--   3. Clique em "Run"
--
-- Opção 3 - Node script:
--   node scripts/run-seed.js
