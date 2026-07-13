export interface TeamPlayer {
  id: string;
  name: string;
}

/** One daily reading: total accumulated EXP for a player on a given date. */
export interface ExpRecord {
  playerId: string;
  /** YYYY-MM-DD */
  date: string;
  exp: number;
}

export interface TeamData {
  players: TeamPlayer[];
  records: ExpRecord[];
}
