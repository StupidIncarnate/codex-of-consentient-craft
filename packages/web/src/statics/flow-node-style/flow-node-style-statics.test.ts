import { flowNodeStyleStatics } from './flow-node-style-statics';

describe('flowNodeStyleStatics', () => {
  it('VALID: {full value} => matches expected shape', () => {
    expect(flowNodeStyleStatics).toStrictEqual({
      accent: {
        decision: '#f5a623',
        action: '#4aa3df',
        state: '#8b9bb4',
        terminal: '#5bbf8a',
      },
      selectionRing: '#ff6b35',
    });
  });
});
