// Recolha diária da XP dos dois bonecos: lê todos os dias que o guildstats.eu
// ainda expõe e acrescenta os que faltam em data/scraped-history/<id>.json.
// Nunca apaga nem sobrescreve — por isso é seguro correr as vezes que forem
// precisas, e um dia perdido é recuperado sozinho na corrida seguinte (o
// guildstats guarda ~30 dias).
//
// Corre no PC, de hora a hora, por scripts/scrape-xp-local.ps1 — o guildstats
// devolve 403 aos IPs dos runners do GitHub, por isso a Action deixou de ser
// uma fonte fiável. Ver .github/workflows/scrape-experience.yml.
import { runScraper } from './lib/guildstatsHistory.mjs';
import { CHARACTERS, DATA_DIR } from './lib/trackedPlayers.mjs';

await runScraper({ players: CHARACTERS, dataDir: DATA_DIR });
