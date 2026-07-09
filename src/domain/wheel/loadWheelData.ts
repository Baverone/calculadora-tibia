import type { CharacterId } from '../types';
import type { VocationWheelData } from './types';
import eliteKnightData from '../../data/wheel/elite-knight.json';
import royalPaladinData from '../../data/wheel/royal-paladin.json';
import exaltedMonkData from '../../data/wheel/exalted-monk.json';

const WHEEL_DATA_BY_CHARACTER: Record<CharacterId, VocationWheelData> = {
  'elite-knight': eliteKnightData as VocationWheelData,
  'royal-paladin': royalPaladinData as VocationWheelData,
  'exalted-monk': exaltedMonkData as VocationWheelData,
};

export function getWheelData(characterId: CharacterId): VocationWheelData {
  return WHEEL_DATA_BY_CHARACTER[characterId];
}
