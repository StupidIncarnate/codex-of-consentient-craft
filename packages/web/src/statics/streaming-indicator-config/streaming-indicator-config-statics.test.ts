import { streamingIndicatorConfigStatics } from './streaming-indicator-config-statics';

describe('streamingIndicatorConfigStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(streamingIndicatorConfigStatics).toStrictEqual({
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
    });
  });
});
