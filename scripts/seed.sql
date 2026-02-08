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
-- 4. CRIAR METODOLOGIAS DE VENDAS PADRÃO
-- ============================================
-- SPIN Selling
INSERT INTO sales_methodologies (
  id,
  tenant_id,
  name,
  checkpoints,
  is_default,
  is_custom,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  NULL,  -- NULL = metodologia global (disponível para todos os tenants)
  'SPIN Selling',
  '[
    {"id": "situation", "label": "Situação", "keywords": ["empresa", "cenário", "contexto", "atual"], "tip": "Pergunte sobre o cenário atual do cliente", "description": "Entender a situação atual do cliente"},
    {"id": "problem", "label": "Problema", "keywords": ["dificuldade", "desafio", "problema", "dor"], "tip": "Identifique as dores e dificuldades", "description": "Descobrir os problemas que o cliente enfrenta"},
    {"id": "implication", "label": "Implicação", "keywords": ["impacto", "consequência", "prejuízo", "perda"], "tip": "Mostre o impacto do problema no negócio", "description": "Fazer o cliente perceber o custo de não resolver"},
    {"id": "need_payoff", "label": "Necessidade", "keywords": ["solução", "benefício", "resultado", "ganho"], "tip": "Apresente o valor da solução", "description": "Mostrar como a solução resolve os problemas"}
  ]'::jsonb,
  true,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- GPCT (Goals, Plans, Challenges, Timeline)
INSERT INTO sales_methodologies (
  id,
  tenant_id,
  name,
  checkpoints,
  is_default,
  is_custom,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000011',
  NULL,  -- NULL = metodologia global
  'GPCT',
  '[
    {"id": "goals", "label": "Goals", "keywords": ["objetivo", "meta", "quer", "alcançar"], "tip": "Quais são os objetivos do cliente?", "description": "Entender os objetivos de negócio do cliente"},
    {"id": "plans", "label": "Plans", "keywords": ["plano", "estratégia", "como", "fazer"], "tip": "Como planeja atingir esses objetivos?", "description": "Entender os planos atuais do cliente"},
    {"id": "challenges", "label": "Challenges", "keywords": ["desafio", "obstáculo", "barreira", "dificuldade"], "tip": "Quais obstáculos enfrenta no caminho?", "description": "Identificar os desafios que impedem o progresso"},
    {"id": "timeline", "label": "Timeline", "keywords": ["prazo", "quando", "urgência", "tempo"], "tip": "Qual o prazo para resolver?", "description": "Entender a urgência e timeline do cliente"}
  ]'::jsonb,
  true,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- BANT (Budget, Authority, Need, Timeline)
INSERT INTO sales_methodologies (
  id,
  tenant_id,
  name,
  checkpoints,
  is_default,
  is_custom,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000012',
  NULL,  -- NULL = metodologia global
  'BANT',
  '[
    {"id": "budget", "label": "Budget", "keywords": ["orçamento", "investimento", "valor", "custo"], "tip": "Qual o orçamento disponível?", "description": "Entender a capacidade de investimento"},
    {"id": "authority", "label": "Authority", "keywords": ["decisor", "aprovação", "quem decide", "responsável"], "tip": "Quem toma a decisão de compra?", "description": "Identificar os decisores no processo"},
    {"id": "need", "label": "Need", "keywords": ["necessidade", "precisa", "problema", "dor"], "tip": "Qual a necessidade real do cliente?", "description": "Entender a necessidade que motiva a compra"},
    {"id": "timeline", "label": "Timeline", "keywords": ["prazo", "quando", "urgência", "implementar"], "tip": "Qual o prazo para implementar?", "description": "Entender a urgência do cliente"}
  ]'::jsonb,
  true,
  false,
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
