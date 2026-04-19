/**
 * PURPOSE: Defines immutable animation values for the streaming indicator — glyphs, dot ellipsis states, and dumpster-raid planning verbs
 *
 * USAGE:
 * streamingIndicatorConfigStatics.verbs;
 * // Returns readonly array of planning/scheming verbs cycled while streaming
 */

export const streamingIndicatorConfigStatics = {
  tickMs: 400,
  verbMinMs: 5000,
  verbMaxMs: 10000,
  sparkleGlyphs: ['\u2726', '\u2727', '\u2736', '\u2737'],
  dotStates: ['', '.', '..', '...'],
  verbs: [
    'Casing the alley',
    'Sniffing for loot',
    'Scheming the heist',
    'Mapping the raid',
    'Plotting the grab',
    'Scoping the score',
    'Staking the dumpster',
    'Eyeing the haul',
    'Drafting the caper',
    'Sketching the getaway',
    'Charting the raid',
    'Briefing the minions',
    'Summoning the scribe',
    'Tasking the mage',
    'Rehearsing the plunder',
    'Prowling the backlot',
    'Marking the stash',
    'Rigging the snare',
    'Timing the patrol',
    'Weighing the loot',
  ],
} as const;
