import { QuestIdStub, WardResultStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';

import { useWardDetailBinding } from './use-ward-detail-binding';
import { useWardDetailBindingProxy } from './use-ward-detail-binding.proxy';

describe('useWardDetailBinding', () => {
  describe('initial state', () => {
    it('EMPTY: {questId} => returns null detail and not loading', () => {
      useWardDetailBindingProxy();
      const questId = QuestIdStub({ value: 'test-quest' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useWardDetailBinding({ questId }),
      });

      expect({ detail: result.current.detail, loading: result.current.loading }).toStrictEqual({
        detail: null,
        loading: false,
      });
    });
  });

  describe('requestDetail', () => {
    it('VALID: {wardResultId} => sends ward-detail-request via WS', () => {
      const proxy = useWardDetailBindingProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardResult = WardResultStub();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useWardDetailBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.requestDetail({ wardResultId: wardResult.id });
        },
      });

      const sentMessages = proxy.getSentMessages();

      expect(sentMessages).toStrictEqual([
        {
          type: 'ward-detail-request',
          questId: 'test-quest',
          wardResultId: wardResult.id,
        },
      ]);
    });
  });
});
