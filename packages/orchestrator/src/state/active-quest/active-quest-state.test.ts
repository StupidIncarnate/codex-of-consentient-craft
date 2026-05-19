import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { activeQuestState } from './active-quest-state';

describe('activeQuestState', () => {
  it('EMPTY: {fresh state} => getActive returns null', () => {
    activeQuestState.clear();

    expect(activeQuestState.getActive()).toBe(null);
  });

  it('VALID: {setActive with questId} => getActive returns the questId', () => {
    activeQuestState.clear();
    const questId = QuestIdStub({ value: 'add-auth' });

    activeQuestState.setActive({ questId });

    expect(activeQuestState.getActive()).toBe(questId);
  });

  it('VALID: {setActive then setActive different} => getActive returns the latest', () => {
    activeQuestState.clear();
    const first = QuestIdStub({ value: 'first-quest' });
    const second = QuestIdStub({ value: 'second-quest' });
    activeQuestState.setActive({ questId: first });

    activeQuestState.setActive({ questId: second });

    expect(activeQuestState.getActive()).toBe(second);
  });

  it('VALID: {setActive then setActive null} => getActive returns null', () => {
    activeQuestState.clear();
    const questId = QuestIdStub({ value: 'temp-quest' });
    activeQuestState.setActive({ questId });

    activeQuestState.setActive({ questId: null });

    expect(activeQuestState.getActive()).toBe(null);
  });

  it('VALID: {setActive then clear} => getActive returns null', () => {
    activeQuestState.clear();
    const questId = QuestIdStub({ value: 'clear-me' });
    activeQuestState.setActive({ questId });

    activeQuestState.clear();

    expect(activeQuestState.getActive()).toBe(null);
  });
});
