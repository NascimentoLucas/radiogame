import { BROADCASTER_TUNING, CARGO_PAY, PLACE_COORDS } from '@/gd';
import { TIP_TRUTH, type Broadcaster, type CargoKind, type Phrase, type Place, type World } from '@/game/types';

/** Stylized fictional map (GDD §11: setting is open). Coordinates live in src/gd/world.ts. */
export const PLACES: Place[] = [
  { id: 'truck-stop', name: 'Central Truck Stop', ...PLACE_COORDS['truck-stop'] },
  { id: 'mill-town', name: 'Mill Town', ...PLACE_COORDS['mill-town'] },
  { id: 'river-port', name: 'River Port', ...PLACE_COORDS['river-port'] },
  { id: 'orchard-valley', name: 'Orchard Valley', ...PLACE_COORDS['orchard-valley'] },
  { id: 'quarry', name: 'Old Quarry', ...PLACE_COORDS.quarry },
  { id: 'border-depot', name: 'Border Depot', ...PLACE_COORDS['border-depot'] },
];

export const CARGO_KINDS: CargoKind[] = [
  { id: 'general', name: 'General freight', ...CARGO_PAY.general },
  { id: 'produce', name: 'Produce', ...CARGO_PAY.produce },
  { id: 'lumber', name: 'Lumber', ...CARGO_PAY.lumber },
];

/** Character names are placeholders (GDD §7, §11). Their odds and pay are in src/gd/world.ts. */
export const BROADCASTERS: Broadcaster[] = [
  { id: 'dispatcher', name: 'The Dispatcher', ...BROADCASTER_TUNING.dispatcher },
  { id: 'waitress', name: 'The Truck Stop Waitress', ...BROADCASTER_TUNING.waitress },
  { id: 'rival', name: 'The Rival Driver', ...BROADCASTER_TUNING.rival },
  { id: 'scammer', name: 'The Scammer', ...BROADCASTER_TUNING.scammer },
];

export const PHRASES: Phrase[] = [
  { id: 'loading-now', text: 'Loading dock is open now.', hintsAt: null },
  { id: 'come-on-down', text: 'Come on down, driver.', hintsAt: null },
  { id: 'steady-work', text: 'Steady work, honest pay.', hintsAt: null },
  { id: 'heard-earlier', text: 'Heard this one earlier tonight...', hintsAt: TIP_TRUTH.Outdated },
  { id: 'last-week', text: 'Was still there last week, anyway.', hintsAt: TIP_TRUTH.Outdated },
  { id: 'biggest-load', text: 'Biggest load you ever saw!', hintsAt: TIP_TRUTH.Exaggerated },
  { id: 'trust-me', text: 'Trust me on this one.', hintsAt: TIP_TRUTH.Exaggerated },
  { id: 'cash-up-front', text: 'Cash up front, no questions.', hintsAt: TIP_TRUTH.Scam },
  { id: 'too-good', text: 'Easiest money of your life!', hintsAt: TIP_TRUTH.Scam },
];

export const WORLD: World = {
  places: PLACES,
  cargoKinds: CARGO_KINDS,
  broadcasters: BROADCASTERS,
  phrases: PHRASES,
  homePlaceId: 'truck-stop',
};
