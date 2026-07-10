export interface MiniWorldChangeEvent {
  name: string;
  location: string;
}

export const MINI_WORLD_CHANGE_EVENTS: MiniWorldChangeEvent[] = [
  { name: 'Bank Robbery', location: "Ab'Dendriel, Carlin, Thais ou Venore" },
  { name: 'Beaver Breakout', location: 'Marapur' },
  { name: 'Bibby Bloodbath', location: 'Jakundaf Desert, Femor Hills ou Carlin' },
  { name: 'Bored Witch', location: 'Green Claw Swamp' },
  { name: 'Chakoya Iceberg', location: 'Port Hope (norte)' },
  { name: 'Chyllfroest', location: 'Hrodmir' },
  { name: "Devovorga's Essence", location: 'Vengoth' },
  { name: 'Dworc Camp', location: 'Tiquanda' },
  { name: 'Forsaken', location: "Ab'Dendriel (Forsaken Mine)" },
  {
    name: 'Fury Gates',
    location: "uma das principais cidades (Ab'Dendriel, Ankrahmun, Carlin, Darashia, Edron, Kazordoon, Liberty Bay, Port Hope, Thais ou Venore)",
  },
  { name: 'Goroma Eruption', location: 'Goroma (vulcão Hellgorge)' },
  { name: 'Grimvale Moon', location: 'Grimvale / Oskayaat' },
  { name: 'Hive Outpost', location: 'Liberty Bay (sudoeste)' },
  { name: 'Hunter Camp', location: 'Tiquanda' },
  { name: 'Lumberjack', location: 'Fields of Glory (norte de Carlin)' },
  { name: 'Nightmare', location: 'Darama (Nightmare Isles)' },
  { name: 'Nomads', location: 'deserto de Ankrahmun' },
  { name: 'Noodles is Gone', location: 'arredores de Thais' },
  { name: 'Poacher Caves', location: 'Ferngrims Gate, norte do Green Claw Swamp' },
  { name: 'Oriental Trader', location: 'Ankrahmun, Carlin ou Liberty Bay' },
  { name: 'River Flood', location: 'sul do Outlaw Camp' },
  { name: 'River Runs Deep', location: 'Zao Steppe' },
  { name: 'Shipwrecked', location: 'Krailos (norte)' },
  { name: "Spider's Nest", location: 'oeste de Venore' },
  { name: 'Spirit Gate', location: 'Carlin, Darashia ou Vengoth' },
  { name: 'Stampede', location: 'Tiquanda' },
  { name: 'Thais Kingsday', location: 'Thais' },
  { name: 'Thawing', location: 'Svargrond' },
];
