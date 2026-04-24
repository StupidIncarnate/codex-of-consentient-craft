import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { LoadQuestLayerResponder } from './load-quest-layer-responder';
import { LoadQuestLayerResponderProxy } from './load-quest-layer-responder.proxy';

describe('LoadQuestLayerResponder', () => {
  it('VALID: {export shape} => is a function', () => {
    LoadQuestLayerResponderProxy();

    expect(LoadQuestLayerResponder).toStrictEqual(expect.any(Function));
  });

  it('ERROR: {quest not on disk} => rejects via underlying broker error', async () => {
    const proxy = LoadQuestLayerResponderProxy();
    proxy.setupPassthrough();
    const questId = QuestIdStub({ value: 'nonexistent-load-quest-layer-smoke' });

    await expect(LoadQuestLayerResponder({ questId })).rejects.toThrow(/.+/u);
  });
});
