import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { chatProcessState } from './chat-process-state';
import { chatProcessStateProxy } from './chat-process-state.proxy';

describe('chatProcessState', () => {
  describe('register and kill', () => {
    it('VALID: {registered process} => kill returns true and calls kill fn', () => {
      const proxy = chatProcessStateProxy();
      const processId = ProcessIdStub({ value: 'chat-proc-1' });
      const kill = jest.fn();
      proxy.setupWithProcess({ processId, kill });

      const result = chatProcessState.kill({ processId });

      expect(result).toBe(true);
      expect(kill).toHaveBeenCalledTimes(1);
    });

    it('EMPTY: {unknown process} => kill returns false', () => {
      const proxy = chatProcessStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'nonexistent' });

      const result = chatProcessState.kill({ processId });

      expect(result).toBe(false);
    });

    it('VALID: {registered process} => has returns true', () => {
      const proxy = chatProcessStateProxy();
      const processId = ProcessIdStub({ value: 'chat-proc-2' });
      const kill = jest.fn();
      proxy.setupWithProcess({ processId, kill });

      expect(chatProcessState.has({ processId })).toBe(true);
    });

    it('VALID: {killed process} => has returns false after kill', () => {
      const proxy = chatProcessStateProxy();
      const processId = ProcessIdStub({ value: 'chat-proc-3' });
      const kill = jest.fn();
      proxy.setupWithProcess({ processId, kill });

      chatProcessState.kill({ processId });

      expect(chatProcessState.has({ processId })).toBe(false);
    });
  });

  describe('remove', () => {
    it('VALID: {registered process} => remove without calling kill', () => {
      const proxy = chatProcessStateProxy();
      const processId = ProcessIdStub({ value: 'chat-proc-4' });
      const kill = jest.fn();
      proxy.setupWithProcess({ processId, kill });

      chatProcessState.remove({ processId });

      expect(kill).not.toHaveBeenCalled();
      expect(chatProcessState.has({ processId })).toBe(false);
    });
  });

  describe('killAll', () => {
    it('VALID: {multiple processes} => kills all and clears state', () => {
      const proxy = chatProcessStateProxy();
      const processId1 = ProcessIdStub({ value: 'chat-proc-5' });
      const processId2 = ProcessIdStub({ value: 'chat-proc-6' });
      const kill1 = jest.fn();
      const kill2 = jest.fn();

      proxy.setupEmpty();
      chatProcessState.register({ processId: processId1, kill: kill1 });
      chatProcessState.register({ processId: processId2, kill: kill2 });

      chatProcessState.killAll();

      expect(kill1).toHaveBeenCalledTimes(1);
      expect(kill2).toHaveBeenCalledTimes(1);
      expect(chatProcessState.has({ processId: processId1 })).toBe(false);
      expect(chatProcessState.has({ processId: processId2 })).toBe(false);
    });

    it('EMPTY: {no processes} => killAll does nothing', () => {
      const proxy = chatProcessStateProxy();
      proxy.setupEmpty();

      chatProcessState.killAll();

      expect(chatProcessState.has({ processId: ProcessIdStub({ value: 'any' }) })).toBe(false);
    });
  });
});
