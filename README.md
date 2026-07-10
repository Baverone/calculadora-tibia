# Calculadora de Experiência do Tibia

Aplicação web para acompanhar o progresso de XP de 3 personagens (Elite
Knight, Royal Paladin, Exalted Monk), com histórico persistente, recolha
diária automática de XP via guildstats.eu, gráfico de progressão, uma
calculadora de hunt com hunts guardadas e objetivos de nível definidos
manualmente, timers de hunt (Pot Skills / Food ML) sempre visíveis
independentemente do personagem ativo, e uma aba "Utilitários Tibia" com um
Tibiadrome Tracker (rotação bissemanal + modificadores ativos), um Rashid
Tracker (onde está o NPC hoje) e um Mini World Changes Tracker (eventos
diários aleatórios).

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
data/
  scraped-history/        # <personagem>.json — histórico recolhido pelo robô (commitado pelo Actions)
  tibiadrome/
    modifiers-history.json # modificadores por rotação — commitado por scripts/save-modifier-rotation.mjs
  mini-world-changes/
    history.json           # eventos por dia — commitado por scripts/save-mini-world-changes.mjs
scripts/
  generate-experience-table.mjs  # gera src/data/tibia_experience_table.json
  scrape-experience.mjs           # robô de recolha diária (corre no GitHub Actions)
  save-modifier-rotation.mjs      # regista os 2 modificadores de uma rotação (corres tu, localmente)
  save-mini-world-changes.mjs     # regista os eventos de um dia (corres tu, localmente)
.github/workflows/
  scrape-experience.yml    # agenda + executa o scraper, faz commit dos dados
src/
  config.ts               # GITHUB_REPO — preencher após criares o repositório
  data/
    tibia_experience_table.json  # dataset de referência de XP
    tibiadrome/
      modifiers.ts          # os 9 modificadores possíveis, nomes/descrições oficiais
      rotationAnchor.ts      # âncora de uma vez só: número + início da rotação
    rashid/
      schedule.ts            # cidade/local do Rashid por dia da semana
    miniWorldChanges/
      events.ts               # as 28 mini world changes possíveis, nome + localização
  domain/                # lógica pura, sem React — o "motor" da app
    types.ts             # tipos partilhados (CharacterId, HistoryEntry, AppTabId, ...)
    tibiaDay.ts            # dia de Tibia atual (recua 1 dia antes das 9h em Lisboa) — partilhado por Rashid e Mini World Changes
    experienceTable.ts    # exp(level) e level(exp), fórmula oficial
    levelProgress.ts      # nível atual/próximo, % de progresso
    historyStats.ts       # XP ganha entre leituras consecutivas
    huntCalculator.ts     # cenários de bónus (stamina 150%, stamina+boost 225%)
    validation.ts         # validação de inputs (inteiros, positivos, listas de nível)
    timers/alerts.ts       # beep (Web Audio) + anúncio por voz (SpeechSynthesis) ao terminar um timer
    tibiadrome/
      rotation.ts           # cálculo da rotação atual (número/início/fim) a partir da âncora
      parseModifiers.ts      # deteta os 2 modificadores no texto colado
    rashid/
      rashidSchedule.ts      # lookup na tabela semanal a partir do dia de Tibia (tibiaDay.ts)
    miniWorldChanges/
      parseMiniWorldChanges.ts # deteta N eventos (1 ou mais) no texto colado
  storage/
    characterHistory.ts   # leitura/escrita do histórico manual no localStorage
    sharedHistory.ts       # busca o histórico recolhido pelo robô (GitHub raw)
    huntStorage.ts         # leitura/escrita das hunts guardadas no localStorage
    tibiadromeHistory.ts    # busca o histórico de modificadores (GitHub raw)
    miniWorldChangesHistory.ts # busca o histórico de mini world changes (GitHub raw)
  hooks/
    useCharacterState.ts  # estado (input + histórico manual+partilhado) de um personagem
    useSavedHunts.ts       # estado (lista de hunts guardadas) de um personagem
    useCountdownTimer.ts   # timer regressivo com pausa/reset e loop automático ao terminar
    useRotationClock.ts     # recalcula a rotação atual a cada segundo
    useTibiadromeHistory.ts # busca o histórico de modificadores ao montar
    useRashidClock.ts       # recalcula a localização do Rashid a cada segundo
    useTibiaDayClock.ts     # recalcula o dia de Tibia atual a cada segundo
    useMiniWorldChangesHistory.ts # busca o histórico de mini world changes ao montar
  constants/
    vocations.tsx          # nome, cor e ícone de cada vocação
  components/
    layout/                # TabsBar (inclui a aba "Utilitários Tibia"), CharacterPanel
    xp/                     # input de XP, barra de progresso, cartão de nível
    charts/                  # gráfico de progressão, lista de histórico recente
    hunt/                    # formulário de hunt + cartão de hunt guardada
    timers/                  # TimersPanel (Pot Skills + Food ML) com anel de progresso SVG
    tibiadrome/               # TibiadromeSection — cartão de rotação + submissão de modificadores
    rashid/                   # RashidCard — ícone + cidade/local de hoje + countdown
    miniWorldChanges/         # MiniWorldChangesSection — cartão do dia + submissão de eventos
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

## Timers de hunt

Painel global (`src/components/timers/TimersPanel.tsx`), visível por cima
das abas dos personagens independentemente de qual está ativa — não é
específico de um personagem. Dois timers regressivos independentes:
**Pot Skills** (10 min) e **Food ML** (1 hora), cada um com anel de
progresso SVG, botão Iniciar/Pausar e Reiniciar, mais um botão "Iniciar
ambos" no topo do painel para arrancar os dois em simultâneo.

Ao chegar a zero, cada timer (`src/hooks/useCountdownTimer.ts`): toca um
sinal sonoro via Web Audio API (`src/domain/timers/alerts.ts`, sem
ficheiros de áudio externos), tenta anunciar por voz o nome do timer via
`SpeechSynthesis` (pt-PT — falha silenciosamente se o browser não suportar
ou bloquear), mostra "Terminado!" durante ~3s, e depois reinicia sozinho e
continua a contar em loop contínuo até seres tu a pausar. O countdown segue
um timestamp de fim (não conta ticks), por isso não desvia mesmo que o
separador fique em segundo plano.

## Tibiadrome Tracker

Secção global (`src/components/tibiadrome/TibiadromeSection.tsx`), com duas partes:

**Calendário de rotação**: rotações bissemanais (14 dias) encadeadas sem
gaps, numeradas sequencialmente. Só é preciso definir uma âncora **uma
única vez**: número da rotação + data/hora exata de início, em
`src/data/tibiadrome/rotationAnchor.ts` (constante no código, tal como
`GITHUB_REPO` em `config.ts` — não é um formulário que grava nada, porque o
número e a janela de qualquer rotação passada ou futura são derivados dessa
âncora por fórmula, sem estado mutável a manter sincronizado:
`src/domain/tibiadrome/rotation.ts`). O cartão mostra o número da rotação
atual, início/fim com data (fuso `Europe/Lisbon`, ajusta-se sozinho a
WEST/WET) e tempo relativo ("há Xd HH:MM:SS" / "dentro de Xd HH:MM:SS"), a
atualizar ao segundo.

**Modificadores ativos**: lista de referência dos 9 modificadores possíveis
(`src/data/tibiadrome/modifiers.ts` — nomes/descrições oficiais em inglês;
os que não foram confirmados diretamente marcam um campo `confidence`, nunca
inventados). Colas o anúncio in-game tal como aparece no jogo numa textarea
e clicas "Submeter"; o parser (`src/domain/tibiadrome/parseModifiers.ts`)
procura os 9 nomes no texto (tolerante a maiúsculas/pontuação/quebras de
linha) e exige encontrar exatamente 2 — caso contrário mostra um erro claro
em vez de assumir.

Como o site é estático (sem backend), o botão "Submeter" não grava nada
sozinho: mostra os 2 modificadores detetados e um comando pronto a copiar
(`node scripts/save-modifier-rotation.mjs <rotação> "<mod1>" "<mod2>"`).
Corres esse comando no terminal — ele valida os nomes, acrescenta a entrada
a `data/tibiadrome/modifiers-history.json` (nunca sobrescreve rotações já
registadas) e faz commit + push automaticamente, igual em espírito ao robô
de XP mas correndo localmente em vez de agendado. O site lê esse JSON via
`raw.githubusercontent.com` (`src/storage/tibiadromeHistory.ts`, mesmo
padrão de `sharedHistory.ts`) para mostrar os modificadores da rotação
atual no cartão e o histórico completo por rotação.

## Rashid Tracker

Cartão global (`src/components/rashid/RashidCard.tsx`) com o ícone do NPC
(`public/rashid.png` — não incluído no código, coloca ali o teu ficheiro),
a cidade/local de hoje e um countdown até à próxima mudança.

Horário fixo por dia da semana em `src/data/rashid/schedule.ts`. O "dia de
Tibia" só avança no server save, às 9:00 hora de Lisboa (`Europe/Lisbon`,
ajusta-se sozinho a WEST/WET) — antes disso o dia ainda é o anterior. Essa
lógica de "que dia é hoje em Tibia" vive em `src/domain/tibiaDay.ts`
(partilhada com o Mini World Changes Tracker abaixo, para os dois concordarem
sempre no mesmo dia); `src/domain/rashid/rashidSchedule.ts` só faz o lookup
na tabela semanal a partir daí. Reutiliza o `formatDuration` do Tibiadrome
Tracker para o countdown, a atualizar ao segundo (`src/hooks/useRashidClock.ts`).

## Mini World Changes Tracker

Cartão + submissão (`src/components/miniWorldChanges/MiniWorldChangesSection.tsx`),
mesmo espírito do Tibiadrome mas para as mini world changes: eventos
aleatórios diários (sem rotação fixa, sem número), com um conjunto variável
de eventos ativos por dia — pode ser 1, pode ser vários. Lista de referência
das 28 mini world changes possíveis (nome + localização, todas fornecidas
diretamente, sem necessidade de pesquisa externa) em
`src/data/miniWorldChanges/events.ts`.

O cartão mostra o dia de Tibia atual (mesma lógica de troca às 9:00 do
Rashid Tracker, via `src/domain/tibiaDay.ts` e `src/hooks/useTibiaDayClock.ts`)
e a lista de eventos detetados para hoje, ou um estado vazio a convidar a
colares o anúncio. Colas o texto do Towncryer/World Board numa textarea e
clicas "Submeter"; o parser
(`src/domain/miniWorldChanges/parseMiniWorldChanges.ts`) procura os nomes
conhecidos no texto (tolerante a maiúsculas/pontuação/quebras de linha,
incluindo apóstrofos como em "Spider's Nest") e aceita qualquer quantidade
encontrada, desde que seja pelo menos 1 — caso contrário mostra um erro.

Persistência igual ao Tibiadrome: o botão "Submeter" só mostra os eventos
detetados e um comando pronto a copiar
(`node scripts/save-mini-world-changes.mjs <YYYY-MM-DD> "<evento 1>" [...]`).
Corres esse comando no terminal — valida os nomes, acrescenta a entrada a
`data/mini-world-changes/history.json` (nunca sobrescreve dias já
registados) e faz commit + push automaticamente. O site lê esse JSON via
`raw.githubusercontent.com` (`src/storage/miniWorldChangesHistory.ts`) para
mostrar os eventos de hoje e o histórico completo por dia.

## Validação de inputs

- XP atual: inteiro, não negativo (`src/domain/validation.ts`).
- Raw Experience/h da hunt: número positivo.
- Objetivos de nível: lista separada por vírgulas/espaços, cada um inteiro
  entre 1 e `MAX_KNOWN_LEVEL` (3500).

Mensagens de erro aparecem sob o respetivo formulário.
