import { agentOutputConfigStatics } from './agent-output-config-statics';

describe('agentOutputConfigStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(agentOutputConfigStatics).toStrictEqual({
      limits: {
        maxLinesPerSlot: 500,
        warningThreshold: 400,
      },
      terminal: {
        backgroundColor: '#0d0907',
        textColor: '#e0cfc0',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      },
      scrollbar: {
        width: 8,
      },
    });
  });
});
