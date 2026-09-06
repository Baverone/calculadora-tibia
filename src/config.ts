// "<your-github-username>/<repo-name>" of the public repo that doubles as the
// read-only database: the app fetches data/scraped-history/<id>.json and
// data/celesta-hunts.json straight from raw.githubusercontent.com.
//
// Until this is set correctly nothing loads — there is no manual XP input to
// fall back on any more (see src/storage/sharedHistory.ts and the README).
// The panel says the history is empty; it does not say why.
export const GITHUB_REPO = 'Baverone/calculadora-tibia';
