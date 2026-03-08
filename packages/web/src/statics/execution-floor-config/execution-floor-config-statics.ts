/**
 * PURPOSE: Defines floor labels and roles for the execution dungeon raid view
 *
 * USAGE:
 * executionFloorConfigStatics.floors[0].label;
 * // Returns 'FLOOR 1: CARTOGRAPHY'
 */

export const executionFloorConfigStatics = {
  floors: [
    { label: 'FLOOR 1: CARTOGRAPHY', role: 'pathseeker' },
    { label: 'FLOOR 2: FORGE', role: 'codeweaver' },
    { label: 'FLOOR 3: GAUNTLET', role: 'ward' },
    { label: 'FLOOR 4: ARENA', role: 'siegemaster' },
    { label: 'FLOOR 5: TRIBUNAL', role: 'lawbringer' },
  ],
} as const;
