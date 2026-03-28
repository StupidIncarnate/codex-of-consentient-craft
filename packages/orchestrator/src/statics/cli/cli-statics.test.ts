import { cliStatics } from './cli-statics';

describe('cliStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(cliStatics).toStrictEqual({
      commands: {
        claude: 'claude',
      },
    });
  });
});
