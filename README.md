# Calculadora de Experiência do Tibia

Aplicação web para acompanhar o progresso de XP de 3 personagens (Elite
Knight, Royal Paladin, Exalted Monk), com histórico persistente, recolha
diária automática de XP via guildstats.eu, gráfico de progressão, uma
calculadora de hunt com hunts guardadas e objetivos de nível definidos
manualmente, e um planeador do Wheel of Destiny com conselheiro de IA.

## Setup do GitHub (necessário para a recolha automática)

O input manual de XP funciona sem isto. Mas para ativares a recolha
automática diária:

1. Cria um repositório **público** vazio no GitHub (sem README/licença —
   já temos ficheiros aqui), ex: `calculadora-tibia`.
2. Neste diretório:
   ```bash
   git remote add origin https://github.com/<o-teu-utilizador>/calculadora-tibia.git
   git add -A
   git commit -m "Initial commit"
   git branch -M main
   git push -u origin main
   ```
   (Se o Git pedir para autenticares, o Git Credential Manager do Windows
   deve abrir o browser automaticamente para login.)
3. Edita [`src/config.ts`](src/config.ts) e substitui `GITHUB_REPO` por
   `"<o-teu-utilizador>/calculadora-tibia"`, depois faz commit + push dessa
   alteração.
4. No GitHub, vai a **Actions** → confirma que o workflow "Scrape Tibia
   Experience" aparece. Podes testá-lo já sem esperar pelas 10h: clica em
   **Run workflow** (usa `workflow_dispatch`, ignora a verificação de hora).
5. A partir daí, corre sozinho todos os dias — não precisas de fazer mais nada.

## Como correr o projeto

```bash
npm install
npm run dev
```

Abre o URL indicado pelo Vite (normalmente http://localhost:5173).

Outros comandos:

```bash
npm run build     # build de produção (inclui verificação de tipos TypeScript)
npm run preview   # serve o build de produção localmente
npm run lint       # linter (oxlint)
```

## Stack

- **React + Vite + TypeScript** — arranque e HMR rápidos, tipos para manter os
  cálculos (níveis, XP, hunt) com contratos claros à medida que o projeto crescer.
- **Recharts** para o gráfico de progressão de XP.
- Sem backend próprio: persistência local via `localStorage` (inputs manuais)
  + um repositório GitHub público como "base de dados" partilhada só-leitura
  (histórico recolhido automaticamente — ver secção abaixo).
- Sem framework CSS — tema próprio em `src/styles/theme.css` (dourado/escuro,
  sem assets oficiais do Tibia).

## Recolha automática diária de XP

Um workflow do GitHub Actions
([`.github/workflows/scrape-experience.yml`](.github/workflows/scrape-experience.yml))
corre todos os dias por volta das 10:00 (hora de Lisboa) e executa
[`scripts/scrape-experience.mjs`](scripts/scrape-experience.mjs):

1. Para cada personagem, pede a página de histórico de experiência do
   guildstats.eu (`include/character/tab.php?nick=...&tab=experience` — o
   endpoint interno que a própria página usa; é HTML estático, não precisa
   de JavaScript/browser para ler).
2. Extrai a linha mais recente (data, nível, XP total) e compara o nível
   reportado com o calculado pela nossa fórmula, como validação cruzada
   (avisa no log se não bater certo).
3. Só adiciona a entrada se essa data ainda não estiver guardada em
   `data/scraped-history/<personagem>.json` — nunca apaga ou sobrescreve
   histórico existente.
4. Cada personagem é tratado de forma independente: se um falhar (site em
   baixo, mudança de layout), os outros continuam normalmente, e tenta-se
   de novo no dia seguinte.
5. Faz commit + push das alterações de volta ao repositório.

Como o cron do GitHub Actions corre em UTC e não ajusta sozinho para o
horário de verão, há dois triggers (09:00 e 10:00 UTC, cobrindo inverno e
verão) — o próprio script confirma a hora real em Lisboa antes de agir, por
isso é seguro mesmo que ambos disparem na mesma semana de mudança de hora.

A app (`src/storage/sharedHistory.ts`) busca este JSON diretamente do
GitHub (`raw.githubusercontent.com`) ao carregar, e junta-o com o histórico
manual do `localStorage` — entradas automáticas aparecem marcadas "AUTO" na
lista de histórico recente. **Isto só funciona depois de definires
`GITHUB_REPO` em [`src/config.ts`](src/config.ts)** com o teu
`utilizador/repositório` — ver instruções de setup mais abaixo.

O input manual de XP continua a funcionar exatamente como antes e não é
afetado por isto — serve para corrigir valores ou registar XP fora do
horário do robô.

## Fonte de verdade da experiência

A fórmula oficial do Tibia está implementada em
[`src/domain/experienceTable.ts`](src/domain/experienceTable.ts):

```
exp(level) = round((50/3) * (level^3 - 6*level^2 + 17*level - 12))
```

É usada diretamente (em vez de uma tabela estática) para que qualquer nível —
incluindo acima de 3500 — funcione automaticamente. O ficheiro
`src/data/tibia_experience_table.json` continua a existir como dataset de
referência oficial (níveis 1–3500), gerado por
[`scripts/generate-experience-table.mjs`](scripts/generate-experience-table.mjs);
volta a correr esse script se algum dia precisares de regenerar o ficheiro.

## Estrutura do projeto

```
api/
  wheel-advisor.ts         # função serverless (Vercel) — proxy para a API da Anthropic
data/
  scraped-history/        # <personagem>.json — histórico recolhido pelo robô (commitado pelo Actions)
scripts/
  generate-experience-table.mjs  # gera src/data/tibia_experience_table.json
  scrape-experience.mjs           # robô de recolha diária (corre no GitHub Actions)
.github/workflows/
  scrape-experience.yml    # agenda + executa o scraper, faz commit dos dados
src/
  config.ts               # GITHUB_REPO — preencher após criares o repositório
  data/
    tibia_experience_table.json  # dataset de referência de XP
    wheel/                        # dados do Wheel of Destiny (mechanics.json + 1 ficheiro por vocação)
  domain/                # lógica pura, sem React — o "motor" da app
    types.ts             # tipos partilhados (CharacterId, HistoryEntry, ...)
    experienceTable.ts    # exp(level) e level(exp), fórmula oficial
    levelProgress.ts      # nível atual/próximo, % de progresso
    historyStats.ts       # XP ganha entre leituras consecutivas
    huntCalculator.ts     # cenários de bónus (stamina 150%, stamina+boost 225%)
    validation.ts         # validação de inputs (inteiros, positivos, listas de nível)
    wheel/                 # pontos por domínio, estágios de Revelation, carregamento dos dados por vocação
  storage/
    characterHistory.ts   # leitura/escrita do histórico manual no localStorage
    sharedHistory.ts       # busca o histórico recolhido pelo robô (GitHub raw)
    huntStorage.ts         # leitura/escrita das hunts guardadas no localStorage
    wheelBuildStorage.ts    # leitura/escrita das builds do Wheel guardadas no localStorage
  hooks/
    useCharacterState.ts  # estado (input + histórico manual+partilhado) de um personagem
    useSavedHunts.ts       # estado (lista de hunts guardadas) de um personagem
    useSavedWheelBuilds.ts  # estado (lista de builds do Wheel guardadas) de um personagem
  constants/
    vocations.tsx          # nome, cor e ícone de cada vocação
  components/
    layout/                # TabsBar, CharacterPanel (composição das abas)
    xp/                     # input de XP, barra de progresso, cartão de nível
    charts/                  # gráfico de progressão, lista de histórico recente
    hunt/                    # formulário de hunt + cartão de hunt guardada
    wheel/                    # planeador do Wheel of Destiny + conselheiro de IA
  styles/theme.css          # tema visual
```

Todos os personagens ficam sempre montados (só a aba ativa é mostrada via
CSS), para que o input em curso de um personagem nunca se perca ao trocar de
aba.

## Onde adicionar novas funcionalidades

- **Nova lógica de cálculo** (ex: tempo até um nível X, taxa média de XP/h):
  adiciona uma função pura em `src/domain/`. Não depende de React, por isso é
  fácil de testar e reutilizar.
- **Comparação entre personagens**: reutiliza `useCharacterState` para cada
  personagem (já usado em `CharacterPanel`) e cria um componente novo que
  itera sobre os 3 estados — não precisa de tocar no domínio.
- **Gráfico de curva de XP por nível**: `domain/experienceTable.ts` já expõe
  `experienceForLevel`; um novo componente em `components/charts/` pode gerar
  os pontos diretamente a partir daí.
- **Novas vocações/servidores**: estende `src/constants/vocations.tsx`.
- **Persistência diferente** (ex: backend, IndexedDB): só os ficheiros em
  `src/storage/` precisam de mudar — o resto da app não sabe onde os dados
  são guardados.

## Calculadora de hunt

Cada hunt guardada (nome, Raw Experience/h, objetivos de nível escolhidos
manualmente) é persistida por personagem (`src/storage/huntStorage.ts`) e
recalculada em tempo real a partir da XP atual do personagem — por isso os
tempos estimados ficam sempre corretos, mesmo que voltes à app dias depois
com a XP atualizada. São mostrados dois cenários (só os que importam na
prática): **Stamina (150%)** e **Stamina + Boost (225%)**, um por cada
objetivo de nível que adicionares. Se o objetivo já tiver sido alcançado,
mostra "Atingido" em vez de um tempo.

Cada hunt guardada tem ainda duas ferramentas adicionais
(`src/components/hunt/LevelPlanSection.tsx` e `DailySimulationSection.tsx`,
lógica em `src/domain/levelPlan.ts` e `src/domain/dailySimulation.ts`):

- **Planeamento nível a nível**: escolhes um nível objetivo e vês uma tabela
  com uma linha por nível, XP e tempo necessários (Stamina 150% e Stamina +
  Boost 225% lado a lado), e o tempo acumulado até esse nível. Limitado a 500
  níveis de diferença para não gerar tabelas gigantes.
- **Previsão por data**: indicas quantas horas/dia fazes hunt com e sem
  Boost e escolhes uma data futura. Mostra uma tabela de checkpoints (data,
  nível estimado, XP acumulada) desde hoje até essa data — diária se forem
  até 30 dias, semanal até 210 dias, e a partir daí um checkpoint no dia 1 de
  cada mês, para a tabela nunca ficar gigante. A data final escolhida
  aparece sempre como última linha (destacada a dourado), seja qual for a
  granularidade.

## Wheel of Destiny

Cada personagem tem um planeador do Wheel of Destiny (`src/components/wheel/`),
com dados em `src/data/wheel/` recolhidos da TibiaWiki em 2026-07-09 (já
refletindo a "Vocation Adjustments Update 2026" de 16/06/2026, que reformulou
vários perks). **Nem todos os valores são 100% confirmados** — cada perk tem
um campo `confidence`; onde a fonte disponível era anterior à reformulação
(ou, no caso do Monk, inexistente), o valor está marcado como "a confirmar"
em vez de inventado. A mecânica de pontos (4 domínios × 9 slices, custo por
anel 50/75/100/150/200, limiares de Revelation aos 250/500/1000) está
confirmada e cruzada entre duas fontes independentes.

O Gem Atelier está incluído como contexto mecânico (tamanhos de gema, slots
de mod, afinidade de domínio) mas sem a lista exaustiva dos ~70 mods
individuais — está fora do âmbito desta 1ª fase (ver `mechanics.json`).
Simulação exata de dano/equipamento (armas, tiers, runas, charms) é uma
fase futura, ainda não implementada.

**Conselheiro de IA**: pedes uma sugestão descrevendo o teu objetivo em
texto livre; a função serverless [`api/wheel-advisor.ts`](api/wheel-advisor.ts)
(Vercel) envia os dados reais do Wheel + o teu objetivo para a API da
Anthropic (`claude-sonnet-5`, com tool use para garantir resposta
estruturada) e devolve uma distribuição sugerida + explicação. **Requer**
a variável de ambiente `ANTHROPIC_API_KEY` configurada no Vercel (Settings →
Environment Variables) — a chave nunca é exposta ao browser. Só funciona no
site publicado, não em `npm run dev` local (Vite não corre funções
serverless); usa `npx vercel dev` se quiseres testar isto localmente.

Builds (manuais ou sugeridas pela IA) guardam-se por personagem em
`localStorage` (`src/storage/wheelBuildStorage.ts`), para comparares depois.

## Validação de inputs

- XP atual: inteiro, não negativo (`src/domain/validation.ts`).
- Raw Experience/h da hunt: número positivo.
- Objetivos de nível: lista separada por vírgulas/espaços, cada um inteiro
  entre 1 e `MAX_KNOWN_LEVEL` (3500).

Mensagens de erro aparecem sob o respetivo formulário.
