/**
 * PURPOSE: Defines floor names, roles, and types for the execution dungeon raid view
 *
 * USAGE:
 * executionFloorConfigStatics.floors[0].name;
 * // Returns 'HOMEBASE'
 */

export const executionFloorConfigStatics = {
  floors: [
    { name: 'HOMEBASE', role: 'chaoswhisperer', type: 'entrance' },
    { name: 'HOMEBASE', role: 'glyphsmith', type: 'entrance' },
    { name: 'ENTRANCE: CARTOGRAPHY', role: 'pathseeker', type: 'entrance' },
    { name: 'FORGE', role: 'codeweaver', type: 'floor' },
    { name: 'MINI BOSS', role: 'ward', wardPosition: 'first', type: 'floor' },
    { name: 'INFIRMARY', role: 'spiritmender', type: 'floor' },
    { name: 'ARENA', role: 'siegemaster', type: 'floor' },
    { name: 'TRIBUNAL', role: 'lawbringer', type: 'floor' },
    { name: 'FLOOR BOSS', role: 'ward', wardPosition: 'last', type: 'floor' },
  ],
} as const;
