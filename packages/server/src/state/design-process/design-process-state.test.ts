import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { designProcessState } from './design-process-state';
import { designProcessStateProxy } from './design-process-state.proxy';

const makePort = (): ReturnType<typeof QuestStub>['designPort'] =>
  QuestStub({ designPort: 5042 as never }).designPort;

describe('designProcessState', () => {
  describe('register and get', () => {
    it('VALID: {register then get} => returns registered process', () => {
      const proxy = designProcessStateProxy();
      proxy.setupEmpty();

      const questId = QuestIdStub();
      const port = makePort()!;
      const kill = jest.fn();

      designProcessState.register({ questId, port, kill });
      const result = designProcessState.get({ questId });

      expect(result).toStrictEqual({ port: 5042, kill });
    });

    it('EMPTY: {get without register} => returns null', () => {
      const proxy = designProcessStateProxy();
      proxy.setupEmpty();

      const questId = QuestIdStub();
      const result = designProcessState.get({ questId });

      expect(result).toBe(null);
    });
  });

  describe('remove', () => {
    it('VALID: {remove existing} => returns true and removes from state', () => {
      const proxy = designProcessStateProxy();
      proxy.setupEmpty();

      const questId = QuestIdStub();
      const port = makePort()!;
      const kill = jest.fn();

      designProcessState.register({ questId, port, kill });
      const removed = designProcessState.remove({ questId });
      const result = designProcessState.get({ questId });

      expect(removed).toBe(true);
      expect(result).toBe(null);
    });
  });

  describe('stopAll', () => {
    it('VALID: {two processes registered} => kills both and clears state', () => {
      const proxy = designProcessStateProxy();
      proxy.setupEmpty();

      const questId1 = QuestIdStub({ value: 'quest-1' });
      const questId2 = QuestIdStub({ value: 'quest-2' });
      const kill1 = jest.fn();
      const kill2 = jest.fn();
      const port = makePort()!;

      designProcessState.register({ questId: questId1, port, kill: kill1 });
      designProcessState.register({ questId: questId2, port, kill: kill2 });

      designProcessState.stopAll();

      expect(kill1.mock.calls).toStrictEqual([[]]);
      expect(kill2.mock.calls).toStrictEqual([[]]);
      expect(designProcessState.get({ questId: questId1 })).toBe(null);
      expect(designProcessState.get({ questId: questId2 })).toBe(null);
    });
  });
});
