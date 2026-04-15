import { FlowStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { questSaveInvariantsTransformer } from './quest-save-invariants-transformer';

describe('questSaveInvariantsTransformer', () => {
  it('VALID: {default empty quest} => returns empty array', () => {
    const quest = QuestStub();

    const failures = questSaveInvariantsTransformer({ quest });

    expect(failures).toStrictEqual([]);
  });

  it('INVALID: {two flows share id} => returns only the failed Flow ID Uniqueness check', () => {
    const quest = QuestStub({
      flows: [FlowStub({ id: 'login-flow' as never }), FlowStub({ id: 'login-flow' as never })],
    });

    const failures = questSaveInvariantsTransformer({ quest });

    expect(failures).toStrictEqual([
      {
        name: 'Flow ID Uniqueness',
        passed: false,
        details: 'Duplicate flow ids: login-flow',
      },
    ]);
  });
});
