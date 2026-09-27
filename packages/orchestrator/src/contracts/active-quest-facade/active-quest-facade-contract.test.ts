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

  it('VALID: {no data fields} => the contract carries no required data of its own', () => {
    const result = activeQuestFacadeContract.parse({
      setActive: () => undefined,
      clear: () => undefined,
    });

    expect(result).toStrictEqual({
      setActive: expect.any(Function),
      clear: expect.any(Function),
    });
  });
});
