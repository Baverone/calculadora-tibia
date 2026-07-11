import type { AccessBossSectionData } from '../../domain/types';

// Quests/Acessos/Bosses tracked per character. Content given verbatim by the
// user (already researched/confirmed against TibiaWiki and quest guides) —
// do not invent or rename items here; ask before assuming anything missing.
export const ACCESS_BOSS_SECTIONS: AccessBossSectionData[] = [
  {
    section: 'Úteis',
    items: [
      { id: 'postman', label: 'The Postman Missions', tag: 'own', note: 'No Quest Log como "The Postman Missions".' },
      { id: 'djinn_blue', label: 'The Djinn War (Marid / azul)', tag: 'own', note: 'No Quest Log como "The Djinn War - Marid Faction".' },
      { id: 'djinn_green', label: 'The Djinn War (Efreet / verde)', tag: 'own', note: 'No Quest Log como "The Djinn War - Efreet Faction".' },
      { id: 'rashid', label: 'The Travelling Trader (Rashid)', tag: 'none', note: 'Sem missões, não aparece no Quest Log — confirma negociando diretamente com o Rashid.' },
      { id: 'thieves', label: 'The Thieves Guild', tag: 'own', note: 'No Quest Log como "The Thieves Guild".' },
      { id: 'shadows', label: 'Shadows of Yalahar', tag: 'own', note: 'No Quest Log como "Shadows of Yalahar".' },
      { id: 'pits', label: 'The Pits of Inferno', tag: 'own', note: 'No Quest Log como "The Pits of Inferno".' },
      { id: 'inquisition', label: 'The Inquisition', tag: 'own', note: 'No Quest Log como "The Inquisition".' },
    ],
  },
  {
    section: 'Acessos',
    items: [
      { id: 'barbarian', label: 'Barbarian Test', tag: 'none', note: 'Não aparece no Quest Log. Confirma pelo achievement "Honorary Barbarian"/"Bearhugger" ou com o Sven em Svargrond.' },
      { id: 'lions_rock', label: "Lion's Rock (Inner Sanctum)", tag: 'none', note: 'Não aparece no Quest Log. Confirma pelo achievement "Lion\'s Den Explorer".' },
      { id: 'shattered', label: 'The Shattered Isles', tag: 'own', note: 'No Quest Log como "The Shattered Isles".' },
      { id: 'ice_islands', label: 'The Ice Islands', tag: 'own', note: 'No Quest Log como "The Ice Islands". Requer Barbarian Test antes.' },
      { id: 'twenty_miles', label: 'Twenty Miles Beneath the Sea', tag: 'own', note: 'No Quest Log como "Twenty Miles Beneath the Sea".' },
      { id: 'explorer_society', label: 'The Explorer Society', tag: 'own', note: 'No Quest Log como "The Explorer Society".' },
      { id: 'blood_brothers', label: 'Blood Brothers', tag: 'own', note: 'No Quest Log como "Blood Brothers".' },
      { id: 'new_frontier', label: 'The New Frontier', tag: 'own', note: 'No Quest Log como "The New Frontier".' },
      { id: 'wrath_emperor', label: 'Wrath of the Emperor', tag: 'own', note: 'No Quest Log como "Wrath of the Emperor".' },
      { id: 'ape_city', label: 'The Ape City', tag: 'own', note: 'No Quest Log como "The Ape City".' },
      { id: 'rathleton_citizen', label: 'Rathleton — rank Citizen', tag: 'sub', parent: 'Rathleton', note: '3º rank dentro da quest "Rathleton" (depois de Commoner e Inhabitant).' },
      { id: 'dark_trails', label: 'Dark Trails', tag: 'own', note: 'No Quest Log como "Dark Trails".' },
      { id: 'asura_palace', label: 'Asura Palace', tag: 'none', note: 'Quest de superfície não aparece no Quest Log. O acesso à cave secreta é missão dentro de "The Secret Library".' },
      { id: 'dream_courts', label: 'The Dream Courts', tag: 'own', note: 'No Quest Log como "The Dream Courts".' },
      { id: 'secret_library', label: 'The Secret Library', tag: 'own', note: 'No Quest Log como "The Secret Library". Contém a submissão "The Order of the Falcon".' },
      { id: 'soul_war', label: 'Soul War', tag: 'own', note: 'No Quest Log como "Soul War".' },
      { id: 'primal_ordeal', label: 'Primal Ordeal', tag: 'own', note: 'No Quest Log como "Primal Ordeal".' },
      { id: 'rotten_blood', label: 'Rotten Blood', tag: 'own', note: 'No Quest Log como "Rotten Blood".' },
    ],
  },
  {
    section: 'Bosses',
    items: [
      { id: 'hero_rathleton', label: 'Hero of Rathleton', tag: 'own', note: 'No Quest Log como "Hero of Rathleton". Só desbloqueia depois do rank Squire em "Rathleton".' },
      { id: 'cults_tibia', label: 'Cults of Tibia', tag: 'own', note: 'No Quest Log como "Cults of Tibia".' },
      { id: 'grimvale', label: 'Grimvale', tag: 'own', note: 'No Quest Log como "Grimvale" — 1º capítulo: "The Curse of the Full Moon".' },
      { id: 'curse_spreads', label: 'The Curse Spreads', tag: 'sub', parent: 'Grimvale', note: '2º capítulo dentro da quest "Grimvale".' },
      { id: 'bigfoot_rank4', label: "Bigfoot's Burden — Rank IV", tag: 'sub', parent: "Bigfoot's Burden", note: '4º rank dentro da quest "Bigfoot\'s Burden" — dá acesso às Warzones 1-3.' },
      { id: 'bigfoot_free', label: "Bigfoot's Burden — acesso livre aos bosses", tag: 'sub', parent: "Bigfoot's Burden", note: 'Missão final da mesma quest — trocar itens dos bosses com o Gnomission.' },
      { id: 'kilmaresh', label: 'Kilmaresh', tag: 'own', note: 'No Quest Log como "Kilmaresh".' },
      { id: 'heart_destruction', label: 'Heart of Destruction', tag: 'own', note: 'No Quest Log como "Heart of Destruction".' },
      { id: 'feaster_souls', label: 'Feaster of Souls', tag: 'own', note: 'No Quest Log como "Feaster of Souls".' },
      { id: 'dd_wz4', label: 'Dangerous Depths — Warzone 4', tag: 'sub', parent: 'Dangerous Depths', note: '1ª das 3 warzones dentro da quest "Dangerous Depths".' },
      { id: 'dd_wz5', label: 'Dangerous Depths — Warzone 5', tag: 'sub', parent: 'Dangerous Depths', note: '2ª warzone da mesma quest.' },
      { id: 'dd_wz6', label: 'Dangerous Depths — Warzone 6', tag: 'sub', parent: 'Dangerous Depths', note: '3ª warzone da mesma quest.' },
      { id: 'ferumbras', label: "Ferumbras' Ascendant", tag: 'own', note: 'No Quest Log o nome oficial é "Ferumbras\' Ascension".' },
      { id: 'order_cobra', label: 'The Order of the Cobra', tag: 'sub', parent: 'Grave Danger', note: 'Submissão dentro da quest "Grave Danger".' },
      { id: 'order_lion', label: 'The Order of the Lion', tag: 'own', note: 'No Quest Log como "The Order of the Lion". Requer "The Order of the Falcon" antes.' },
      { id: 'order_falcon', label: 'The Order of the Falcon', tag: 'sub', parent: 'The Secret Library', note: 'Submissão dentro da quest "The Secret Library".' },
    ],
  },
];
