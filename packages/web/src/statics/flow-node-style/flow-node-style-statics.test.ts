import { emberDepthsThemeStatics } from '../ember-depths-theme/ember-depths-theme-statics';
import { flowNodeStyleStatics } from './flow-node-style-statics';

describe('flowNodeStyleStatics', () => {
  it('VALID: {full value} => matches expected shape', () => {
    expect(flowNodeStyleStatics).toStrictEqual({
      accent: {
        decision: '#fbbf24',
        action: '#ff6b35',
        state: '#8a7260',
        terminal: '#4ade80',
      },
      selectionRing: '#ff6b35',
      edgeStroke: '#8a7260',
    });
  });

  // The literals above are the contract with a designer's eye; this is the contract with the design
  // SYSTEM. Asserting only the hexes would pass on a value that drifted off the palette by hand,
  // which is exactly how the canvas ended up wearing four colours the app does not own.
  it('VALID: {every token} => resolves to a colour the Ember Depths palette defines', () => {
    const { colors } = emberDepthsThemeStatics;
    const paletteValues = Object.values(colors);
    const used = [
      ...Object.values(flowNodeStyleStatics.accent),
      flowNodeStyleStatics.selectionRing,
      flowNodeStyleStatics.edgeStroke,
    ];

    expect(used.filter((token) => paletteValues.includes(token))).toStrictEqual(used);
  });

  it('VALID: {four node types} => each wears a distinct accent so type is readable without the icon', () => {
    const accents = Object.values(flowNodeStyleStatics.accent);

    expect([...new Set(accents)]).toStrictEqual(accents);
  });
});
