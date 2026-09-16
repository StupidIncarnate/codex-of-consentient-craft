import { siegelenseOutputStatics } from './siegelense-output-statics';

describe('siegelenseOutputStatics', () => {
  it('VALID: exported value => matches the complete statics shape', () => {
    expect(siegelenseOutputStatics).toStrictEqual({
      json: {
        indentSpaces: 2,
      },
      flags: {
        json: '--json',
        human: '--human',
        help: '--help',
        helpShort: '-h',
      },
    });
  });
});
