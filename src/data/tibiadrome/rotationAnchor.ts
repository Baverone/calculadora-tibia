import type { RotationAnchor } from '../../domain/tibiadrome/rotation';

// One-time anchor: the rotation number active at `startAt`. Every later (or
// earlier) rotation's number and window is derived from this by pure date
// math (see domain/tibiadrome/rotation.ts) — this never needs to change
// again once set correctly, even as rotations keep advancing.
//
// This is our own local numbering (not Tibia's official in-game rotation
// number, which the user didn't have handy) — #1 is the rotation that
// started 2026-07-08 09:00 WEST.
export const ROTATION_ANCHOR: RotationAnchor = {
  number: 1,
  startAt: '2026-07-08T09:00:00+01:00',
};
