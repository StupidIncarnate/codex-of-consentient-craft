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
    { name: 'ENTRANCE: MAPPING DUMPSTER', role: 'pathseeker-surface', type: 'entrance' },
    { name: 'ENTRANCE: MAPPING DUMPSTER', role: 'pathseeker-dedup', type: 'entrance' },
    {
      name: 'ENTRANCE: MAPPING DUMPSTER',
      role: 'pathseeker-assertion-correctness',
      type: 'entrance',
    },
    { name: 'ENTRANCE: MAPPING DUMPSTER', role: 'pathseeker-walk', type: 'entrance' },
    { name: 'FORGE', role: 'codeweaver', type: 'floor' },
    { name: 'EXTERMINATION', role: 'pesteater', type: 'floor' },
    { name: 'MINI BOSS', role: 'ward', wardPosition: 'first', type: 'floor' },
    { name: 'INFIRMARY', role: 'spiritmender', type: 'floor' },
    { name: 'GLUEWORKS', role: 'flowrider', type: 'floor' },
    { name: 'ARENA', role: 'siegemaster', type: 'floor' },
    { name: 'TRIBUNAL', role: 'lawbringer', type: 'floor' },
    { name: 'QUARANTINE: WARDENS', role: 'blightwarden-security-minion', type: 'floor' },
    { name: 'QUARANTINE: WARDENS', role: 'blightwarden-dedup-minion', type: 'floor' },
    { name: 'QUARANTINE: WARDENS', role: 'blightwarden-perf-minion', type: 'floor' },
    { name: 'QUARANTINE: WARDENS', role: 'blightwarden-integrity-minion', type: 'floor' },
    { name: 'QUARANTINE: WARDENS', role: 'blightwarden-dead-code-minion', type: 'floor' },
    { name: 'QUARANTINE', role: 'blightwarden', type: 'floor' },
    { name: 'FLOOR BOSS', role: 'ward', wardPosition: 'last', type: 'floor' },
    { name: 'HOMEBASE', role: 'pathseeker', type: 'entrance' },
  ],
} as const;
