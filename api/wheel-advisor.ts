// Vercel serverless function (Node.js runtime). Proxies a request to the
// Anthropic API, keeping ANTHROPIC_API_KEY server-side only — the browser
// never sees it. Set this env var in the Vercel project dashboard
// (Settings → Environment Variables); it does NOT work locally with plain
// `npm run dev` (Vite doesn't run serverless functions) — use `vercel dev`
// or test against the deployed site.
import eliteKnightData from '../src/data/wheel/elite-knight.json' with { type: 'json' };
import royalPaladinData from '../src/data/wheel/royal-paladin.json' with { type: 'json' };
import exaltedMonkData from '../src/data/wheel/exalted-monk.json' with { type: 'json' };
import mechanicsData from '../src/data/wheel/mechanics.json' with { type: 'json' };

const WHEEL_DATA_BY_CHARACTER: Record<string, unknown> = {
  'elite-knight': eliteKnightData,
  'royal-paladin': royalPaladinData,
  'exalted-monk': exaltedMonkData,
};

const ANTHROPIC_MODEL = 'claude-sonnet-5';

interface AdvisorRequestBody {
  characterId: string;
  vocationName: string;
  currentLevel: number;
  pointsAvailable: number;
  goal: string;
}

function buildSystemPrompt(): string {
  return `Ajudas a distribuir os pontos de promoção do Wheel of Destiny (Tibia) para um personagem.

Regras da mecânica que tens de respeitar:
- Existem 4 domínios; cada um aceita entre 0 e ${mechanicsData.domainRings.pointsToMaxDomain} pontos.
- A soma de pontos por todos os domínios não pode exceder os pontos disponíveis do jogador.
- Revelation Perks desbloqueiam por estágio aos ${mechanicsData.revelationPerks.stageThresholds.join('/')} pontos investidos NESSE domínio.
- Alguns valores nos dados fornecidos estão marcados como "a confirmar" — nesses casos, sê honesto no teu raciocínio de que o número exato pode não estar 100% atualizado, mas a mecânica geral está correta.
- Não inventes perks, domínios ou vocações que não estejam nos dados fornecidos.

Usa a ferramenta suggest_wheel_build para responderes SEMPRE em formato estruturado, com os domainId exatamente como aparecem nos dados (campo "id" de cada domínio), e o raciocínio em português de Portugal, claro e conciso (3-6 frases).`;
}

function buildUserPrompt(body: AdvisorRequestBody, wheelData: unknown): string {
  return `Personagem: ${body.vocationName} (nível ${body.currentLevel})
Pontos de promoção disponíveis: ${body.pointsAvailable}
Objetivo descrito pelo jogador: "${body.goal}"

Dados do Wheel of Destiny para esta vocação (fonte de verdade, não inventes nada fora disto):
${JSON.stringify(wheelData, null, 2)}

Mecânica geral partilhada (domínios, Gem Atelier, dedication perks):
${JSON.stringify(mechanicsData, null, 2)}

Sugere a melhor distribuição de pontos pelos 4 domínios para atingir o objetivo do jogador, e explica porquê. Considera também o Gem Atelier como contexto complementar (não precisas de detalhar gemas específicas, já que a lista exaustiva de mods não está disponível).`;
}

const WHEEL_BUILD_TOOL = {
  name: 'suggest_wheel_build',
  description: 'Propõe uma distribuição de pontos do Wheel of Destiny pelos 4 domínios de uma vocação.',
  input_schema: {
    type: 'object',
    properties: {
      allocations: {
        type: 'array',
        description: 'Uma entrada por domínio (deve cobrir todos os domínios da vocação, mesmo que com 0 pontos).',
        items: {
          type: 'object',
          properties: {
            domainId: { type: 'string' },
            points: { type: 'number' },
          },
          required: ['domainId', 'points'],
        },
      },
      reasoning: {
        type: 'string',
        description: 'Explicação breve (3-6 frases) em português de Portugal do porquê desta distribuição.',
      },
    },
    required: ['allocations', 'reasoning'],
  },
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido.' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY não está configurada neste deploy (Vercel → Settings → Environment Variables).' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Pedido inválido.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const candidate = rawBody as Partial<AdvisorRequestBody> | null;
  if (
    !candidate ||
    typeof candidate.characterId !== 'string' ||
    typeof candidate.vocationName !== 'string' ||
    typeof candidate.currentLevel !== 'number' ||
    typeof candidate.pointsAvailable !== 'number' ||
    typeof candidate.goal !== 'string'
  ) {
    return new Response(JSON.stringify({ error: 'Pedido inválido: faltam campos obrigatórios.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  const body = candidate as AdvisorRequestBody;

  const wheelData = WHEEL_DATA_BY_CHARACTER[body.characterId];
  if (!wheelData) {
    return new Response(JSON.stringify({ error: `Vocação desconhecida: ${body.characterId}` }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (!body.goal || body.goal.trim() === '') {
    return new Response(JSON.stringify({ error: 'Descreve o teu objetivo antes de pedires uma sugestão.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: buildUserPrompt(body, wheelData) }],
        tools: [WHEEL_BUILD_TOOL],
        tool_choice: { type: 'tool', name: 'suggest_wheel_build' },
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return new Response(JSON.stringify({ error: `Erro da API da Anthropic (${anthropicResponse.status}): ${errorText}` }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const anthropicData = (await anthropicResponse.json()) as { content?: Array<{ type: string; input?: unknown }> };
    const toolUseBlock = anthropicData.content?.find((block) => block.type === 'tool_use');

    if (!toolUseBlock) {
      return new Response(JSON.stringify({ error: 'A IA não devolveu uma sugestão estruturada. Tenta de novo.' }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(toolUseBlock.input), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Falha ao contactar a IA: ${(error as Error).message}` }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}
