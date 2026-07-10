export interface RashidLocation {
  city: string;
  location: string;
}

// Indexed by JS weekday convention (0 = Sunday ... 6 = Saturday), matching
// what domain/rashid/rashidSchedule.ts computes as the "Tibia day".
export const RASHID_WEEKLY_SCHEDULE: RashidLocation[] = [
  { city: 'Carlin', location: 'Primeiro andar do depot' }, // Sunday
  { city: 'Svargrond', location: 'Taverna de Dankwart, ao sul do templo' }, // Monday
  { city: 'Liberty Bay', location: 'Taverna de Lyonel, a oeste do depot' }, // Tuesday
  { city: 'Port Hope', location: 'Taverna de Clyde, a norte do barco' }, // Wednesday
  { city: 'Ankrahmun', location: 'Taverna de Arito, acima do post office' }, // Thursday
  { city: 'Darashia', location: 'Taverna de Miraia, a oeste do barco' }, // Friday
  { city: 'Edron', location: 'Taverna de Mirabell, acima do depot' }, // Saturday
];
