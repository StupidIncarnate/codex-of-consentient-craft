import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';

import { useQuestEventsBinding } from './use-quest-events-binding';
import { useQuestEventsBindingProxy } from './use-quest-events-binding.proxy';

describe('useQuestEventsBinding', () => {
  describe('quest-modified matching', () => {
    it('VALID: {quest-modified for matching questId} => calls onQuestModified', () => {
      const proxy = useQuestEventsBindingProxy();
      const questId = QuestIdStub({ value: 'my-quest' });
      const onQuestModified = jest.fn();

      testingLibraryRenderHookAdapter({
        renderCallback: () => {
          useQuestEventsBinding({ questId, onQuestModified });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'my-quest' },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(onQuestModified).toHaveBeenCalledTimes(1);
    });
  });

  describe('quest-modified non-matching', () => {
    it('VALID: {quest-modified for different questId} => does not call onQuestModified', () => {
      const proxy = useQuestEventsBindingProxy();
      const questId = QuestIdStub({ value: 'my-quest' });
      const onQuestModified = jest.fn();

      testingLibraryRenderHookAdapter({
        renderCallback: () => {
          useQuestEventsBinding({ questId, onQuestModified });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'other-quest' },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(onQuestModified).toHaveBeenCalledTimes(0);
    });
  });

  describe('null questId', () => {
    it('VALID: {questId is null} => does not open WS connection', () => {
      useQuestEventsBindingProxy();
      const onQuestModified = jest.fn();

      testingLibraryRenderHookAdapter({
        renderCallback: () => {
          useQuestEventsBinding({ questId: null, onQuestModified });
        },
      });

      expect(onQuestModified).toHaveBeenCalledTimes(0);
    });
  });

  describe('cleanup', () => {
    it('CLEANUP: {unmount} => closes WS connection', () => {
      const proxy = useQuestEventsBindingProxy();
      const questId = QuestIdStub({ value: 'my-quest' });
      const onQuestModified = jest.fn();

      const { unmount } = testingLibraryRenderHookAdapter({
        renderCallback: () => {
          useQuestEventsBinding({ questId, onQuestModified });
        },
      });

      const closeMock = proxy.getSocketCloseMock();

      expect(closeMock).toHaveBeenCalledTimes(0);

      testingLibraryActAdapter({
        callback: () => {
          unmount();
        },
      });

      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('non-quest-modified messages', () => {
    it('EDGE: {agent-output message} => does not call onQuestModified', () => {
      const proxy = useQuestEventsBindingProxy();
      const questId = QuestIdStub({ value: 'my-quest' });
      const onQuestModified = jest.fn();

      testingLibraryRenderHookAdapter({
        renderCallback: () => {
          useQuestEventsBinding({ questId, onQuestModified });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'agent-output',
              payload: { questId: 'my-quest' },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(onQuestModified).toHaveBeenCalledTimes(0);
    });
  });

  describe('invalid messages', () => {
    it('EDGE: {invalid WS message} => does not call onQuestModified', () => {
      const proxy = useQuestEventsBindingProxy();
      const questId = QuestIdStub({ value: 'my-quest' });
      const onQuestModified = jest.fn();

      testingLibraryRenderHookAdapter({
        renderCallback: () => {
          useQuestEventsBinding({ questId, onQuestModified });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({ invalid: 'not-valid' }),
          });
        },
      });

      expect(onQuestModified).toHaveBeenCalledTimes(0);
    });
  });
});
