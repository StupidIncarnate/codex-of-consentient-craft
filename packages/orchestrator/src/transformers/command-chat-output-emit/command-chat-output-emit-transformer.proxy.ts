import { randomUUID } from '#gateway/node/crypto';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const commandChatOutputEmitTransformerProxy = (): {
  setupEntryIdentity: (params: { uuid: string; timestamp: string }) => void;
} => {
  // The entry's uuid and timestamp come from commandLineToChatEntryTransformer, which runs real.
  const uuidHandle = registerMock({ fn: randomUUID });

  return {
    // randomUUID and Date.prototype.toISOString take no arguments, so [] is the only address.
    setupEntryIdentity: ({ uuid, timestamp }: { uuid: string; timestamp: string }): void => {
      uuidHandle.calledWith([]).returns(uuid);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(timestamp);
    },
  };
};
