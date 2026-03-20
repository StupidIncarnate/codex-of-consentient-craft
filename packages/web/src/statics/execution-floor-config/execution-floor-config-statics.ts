/**
 * PURPOSE: Defines floor names and roles for the execution dungeon raid view
 *
 * USAGE:
 * executionFloorConfigStatics.floors[0].name;
 * // Returns 'SANCTUM'
 */

export const executionFloorConfigStatics = {
  floors: [
    { name: 'SANCTUM', role: 'chaoswhisperer' },
    { name: 'SCRIPTORIUM', role: 'glyphsmith' },
    { name: 'CARTOGRAPHY', role: 'pathseeker' },
    { name: 'FORGE', role: 'codeweaver' },
    { name: 'GAUNTLET', role: 'ward' },
    { name: 'INFIRMARY', role: 'spiritmender' },
    { name: 'ARENA', role: 'siegemaster' },
    { name: 'TRIBUNAL', role: 'lawbringer' },
  ],
} as const;
