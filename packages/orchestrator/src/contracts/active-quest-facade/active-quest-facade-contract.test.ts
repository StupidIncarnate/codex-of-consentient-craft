import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { activeQuestFacadeContract } from './active-quest-facade-contract';
import { ActiveQuestFacadeStub } from './active-quest-facade.stub';

describe('activeQuestFacadeContract', () => {
  it('VALID: {default stub} => parses to a facade whose default no-op functions are callable without throwing', () => {
    const facade = ActiveQuestFacadeStub();

    facade.setActive({ questId: null });
    facade.clear();

    expect(facade).toStrictEqual({
      setActive: facade.setActive,
      clear: facade.clear,
    });
  });

  it('VALID: {custom setActive and clear} => parsed facade routes calls to the custom implementations', () => {
    const setActive = jest.fn();
    const clear = jest.fn();
    const facade = ActiveQuestFacadeStub({ setActive, clear });
    const questId = QuestIdStub();

    facade.setActive({ questId });
    facade.clear();

    expect(setActive).toHaveBeenCalledWith({ questId });
    expect(clear).toHaveBeenCalledWith();
  });

  it('INVALID: {missing setActive} => throws', () => {
    expect(() =>
      activeQuestFacadeContract.parse({
        clear: () => undefined,
      }),
    ).toThrow(/Required/u);
  });

  it('INVALID: {missing clear} => throws', () => {
    expect(() =>
      activeQuestFacadeContract.parse({
        setActive: () => undefined,
      }),
    ).toThrow(/Required/u);
  });
});
