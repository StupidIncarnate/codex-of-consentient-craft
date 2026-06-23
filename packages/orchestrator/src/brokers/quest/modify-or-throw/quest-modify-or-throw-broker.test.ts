import { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts';

import { questModifyOrThrowBroker } from './quest-modify-or-throw-broker';
import { questModifyOrThrowBrokerProxy } from './quest-modify-or-throw-broker.proxy';

describe('questModifyOrThrowBroker', () => {
  it('VALID: {questModifyBroker resolves success} => returns the success result', async () => {
    const proxy = questModifyOrThrowBrokerProxy();
    proxy.setupSuccess();

    const result = await questModifyOrThrowBroker({ input: ModifyQuestInputStub() });

    expect(result).toStrictEqual({ success: true });
  });

  it('ERROR: {questModifyBroker resolves success:false} => throws instead of swallowing the failed persist', async () => {
    const proxy = questModifyOrThrowBrokerProxy();
    proxy.setupFailure();

    await expect(questModifyOrThrowBroker({ input: ModifyQuestInputStub() })).rejects.toThrow(
      /quest modify failed to persist/u,
    );
  });
});
