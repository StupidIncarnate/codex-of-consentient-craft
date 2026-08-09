import { executionFloorConfigStatics } from './execution-floor-config-statics';

describe('executionFloorConfigStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(executionFloorConfigStatics).toStrictEqual({
      floors: [
        { name: 'HOMEBASE', role: 'chaoswhisperer', type: 'entrance' },
        { name: 'HOMEBASE', role: 'glyphsmith', type: 'entrance' },
        { name: 'HOMEBASE', role: 'bughunt', type: 'entrance' },
        { name: 'FORGE', role: 'codeweaver', type: 'floor' },
        { name: 'EXTERMINATION', role: 'pesteater', type: 'floor' },
        { name: 'MINI BOSS', role: 'ward', wardPosition: 'first', type: 'floor' },
        { name: 'INFIRMARY', role: 'spiritmender', type: 'floor' },
        { name: 'GLUEWORKS', role: 'flowrider', type: 'floor' },
        { name: 'ARENA', role: 'siegemaster', type: 'floor' },
        { name: 'QUARANTINE: WARDENS', role: 'blightwarden-group-minion', type: 'floor' },
        { name: 'QUARANTINE: WARDENS', role: 'blightwarden-crosscut-minion', type: 'floor' },
        { name: 'QUARANTINE', role: 'blightwarden', type: 'floor' },
        { name: 'FLOOR BOSS', role: 'ward', wardPosition: 'last', type: 'floor' },
        { name: 'TAVERN', role: 'tavernkeeper', type: 'floor' },
        { name: 'WARPGATE', role: 'warpgate', type: 'floor' },
      ],
    });
  });
});
