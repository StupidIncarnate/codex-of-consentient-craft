import { userMessageCommandPrefixesStatics } from './user-message-command-prefixes-statics';

describe('userMessageCommandPrefixesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(userMessageCommandPrefixesStatics).toStrictEqual({
      prefixes: ['<local-command', '<command', '<task-notification>', '<system-reminder>'],
    });
  });
});
