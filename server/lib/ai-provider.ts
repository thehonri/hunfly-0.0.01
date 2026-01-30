/**
 * AI Provider - Integração com LLM (OpenAI/Anthropic)
 * Gera sugestões de resposta para o copiloto de vendas
 */

import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const USE_OPENAI = !!OPENAI_API_KEY;

let openai: OpenAI | null = null;

if (USE_OPENAI) {
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}

interface GenerateSuggestionOptions {
  conversationContext: string;
  companyKnowledge: string[];
  personalKnowledge: string[];
  goal?: string;
  customerName?: string;
}

interface SuggestionResult {
  suggestedText: string;
  reasoningSummary: string[];
  confidence: number;
}

/**
 * Gera sugestão de resposta usando LLM
 */
export async function generateSuggestion(options: GenerateSuggestionOptions): Promise<SuggestionResult> {
  const {
    conversationContext,
    companyKnowledge,
    personalKnowledge,
    goal = 'Vender produto',
    customerName = 'Cliente',
  } = options;

  // Se não tiver LLM configurado, retornar sugestão mock
  if (!USE_OPENAI || !openai) {
    console.warn('[AI] OpenAI API key not configured, using mock response');
    return {
      suggestedText: `Olá ${customerName}! Posso te ajudar com mais informações sobre nosso produto?`,
      reasoningSummary: [
        'LLM não configurado (usando mock)',
        'Configure OPENAI_API_KEY no .env',
      ],
      confidence: 0,
    };
  }

  // Montar prompt com contexto
  const systemPrompt = buildSystemPrompt(companyKnowledge, personalKnowledge, goal);
  const userPrompt = buildUserPrompt(conversationContext, customerName);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modelo mais barato e rápido
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7, // Criatividade moderada
      max_tokens: 300, // Limitar tamanho da resposta
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(response);

    return {
      suggestedText: parsed.message || 'Não consegui gerar uma sugestão.',
      reasoningSummary: parsed.reasoning || ['Sem contexto suficiente'],
      confidence: Math.round(parsed.confidence || 0.5 * 100),
    };
  } catch (error) {
    console.error('[AI] Error generating suggestion:', error);

    // Fallback em caso de erro
    return {
      suggestedText: `Olá ${customerName}! Como posso te ajudar?`,
      reasoningSummary: [
        'Erro ao gerar sugestão com LLM',
        error instanceof Error ? error.message : 'Unknown error',
      ],
      confidence: 0,
    };
  }
}

/**
 * Monta o system prompt com knowledge base
 */
function buildSystemPrompt(companyKnowledge: string[], personalKnowledge: string[], goal: string): string {
  return `Você é um assistente de vendas inteligente da plataforma Hunfly.

**Objetivo da conversa**: ${goal}

**Base de conhecimento da empresa**:
${companyKnowledge.length > 0 ? companyKnowledge.join('\n') : 'Nenhuma informação disponível'}

**Base de conhecimento pessoal do vendedor**:
${personalKnowledge.length > 0 ? personalKnowledge.join('\n') : 'Nenhuma informação disponível'}

**Seu papel**:
- Sugerir a PRÓXIMA mensagem que o vendedor deve enviar
- Ser empático, profissional e focado em ajudar o cliente
- Usar as informações da base de conhecimento quando relevante
- Seguir as técnicas de vendas (SPIN, BANT, etc)
- Detectar o estágio da conversa (rapport, descoberta, proposta, fechamento)

**Formato de resposta** (JSON):
{
  "message": "Texto da mensagem sugerida (max 200 caracteres)",
  "reasoning": ["Motivo 1", "Motivo 2", "Motivo 3"],
  "confidence": 0.85
}`;
}

/**
 * Monta o user prompt com contexto da conversa
 */
function buildUserPrompt(conversationContext: string, customerName: string): string {
  return `**Contexto da conversa atual**:
${conversationContext}

**Cliente**: ${customerName}

Gere a PRÓXIMA mensagem que o vendedor deve enviar para avançar a conversa em direção ao objetivo. Seja natural, amigável e estratégico.`;
}

/**
 * Gera sugestão para extensão (reuniões ao vivo)
 * Contexto diferente: transcrição em tempo real, não chat
 */
export async function generateMeetingSuggestion(transcription: string, question: string): Promise<string> {
  if (!USE_OPENAI || !openai) {
    return 'Configure OPENAI_API_KEY no .env para usar o copiloto de IA.';
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente de vendas em tempo real durante reuniões.

Seu papel é ajudar o vendedor a responder dúvidas ou contornar objeções DURANTE a reunião.

Seja RÁPIDO, DIRETO e PRÁTICO. Máximo 2 frases.`,
        },
        {
          role: 'user',
          content: `Transcrição da reunião até agora:
${transcription}

Pergunta do vendedor: ${question}

Responda de forma objetiva e acionável.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || 'Não consegui gerar uma sugestão.';
  } catch (error) {
    console.error('[AI] Error in meeting suggestion:', error);
    return 'Erro ao gerar sugestão. Tente novamente.';
  }
}
