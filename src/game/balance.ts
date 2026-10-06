/**
 * Every tuning number lives here. These are provisional answers to GDD §11 open questions
 * (cargo loss per rebroadcast, trip lengths, ...). Tweak freely; tests check relationships, not exact values,
 * except where noted.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const BALANCE = {
  // --- Start of game ---
  startMoney: 200,
  startFuel: 120,
  startLikes: 0,
  startTruck: {
    fuelCapacity: 200,
    cargoCapacity: 20,
    litersPerKm: 0.35,
  },

  // --- Fuel ---
  fuelPricePerLiter: 1.5,

  // --- Travel (real time) ---
  /** Real milliseconds per km driven. 100 km ≈ 33 min. */
  tripMsPerKm: 20_000,
  /** Even a trip across the parking lot takes a little while. */
  minTripMs: 2 * MINUTE,

  // --- Cargo ---
  /** Fraction of a job's remaining cargo left after one rebroadcast. The core dilemma lives here. */
  rebroadcastCargoKeep: 0.35,
  /** NPC drivers slowly take cargo even if nobody rebroadcasts. Remaining cargo halves every this long. */
  cargoHalfLifeMs: 6 * HOUR,
  jobUnitsMin: 10,
  jobUnitsMax: 30,
  /** Random spread on a job's pay per unit (±). */
  payJitter: 0.15,

  // --- Bad tips ---
  /** Exaggerated tips claim this multiple of the real units and pay. */
  exaggerationMin: 1.5,
  exaggerationMax: 2.5,
  /** Outdated tips: the real job only has this fraction (at most) of the claimed cargo left. */
  outdatedKeepMax: 0.15,
  /** Scams claim this multiple of the normal pay for the cargo. */
  scamPayMultiplier: 2.5,
  /** Chance that a bad tip carries a phrase that hints at its truth. */
  tellChance: 0.6,

  // --- Likes ---
  likesPerGoodRebroadcast: 5,
  likesPerBadRebroadcast: -8,
  /** Delay before a rebroadcast's Likes settle, so the result doesn't instantly reveal the truth. */
  likesSettleDelayMs: 10 * MINUTE,

  // --- No fail state (GDD §6) ---
  /** Local dispatcher run: always available, needs no fuel, low pay. */
  localJobPay: 40,
  localJobDurationMs: 20 * MINUTE,
} as const;
