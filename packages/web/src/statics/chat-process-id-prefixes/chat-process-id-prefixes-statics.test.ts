import { chatProcessIdPrefixesStatics } from './chat-process-id-prefixes-statics';

describe('chatProcessIdPrefixesStatics', () => {
  it('VALID: {static export} => exposes the known orchestration-process-id prefixes', () => {
    expect(chatProcessIdPrefixesStatics).toStrictEqual({
      nonSessionPrefixes: ['exec-replay-', 'replay-', 'chat-', 'design-', 'proc-'],
    });
  });
});
