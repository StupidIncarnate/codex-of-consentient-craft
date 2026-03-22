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

    it('EMPTY: {questId: null} => does not send any WS message', () => {
      const proxy = useWardDetailBindingProxy();
      const wardResult = WardResultStub();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useWardDetailBinding({ questId: null }),
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.requestDetail({ wardResultId: wardResult.id });
        },
      });

      expect(proxy.getSentMessages()).toStrictEqual([]);
    });
  });

  describe('ward-detail-response', () => {
    it('VALID: {matching wardResultId response} => sets detail and loading to false', () => {
      const proxy = useWardDetailBindingProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardResult = WardResultStub();
      const detailPayload = 'ward-detail-content-abc';

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useWardDetailBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.requestDetail({ wardResultId: wardResult.id });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'ward-detail-response',
              wardResultId: wardResult.id,
              detail: detailPayload,
            }),
          });
        },
      });

      expect({ detail: result.current.detail, loading: result.current.loading }).toStrictEqual({
        detail: detailPayload,
        loading: false,
      });
    });

    it('EDGE: {non-matching wardResultId response} => does not update detail', () => {
      const proxy = useWardDetailBindingProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardResult = WardResultStub();
      const otherWardResult = WardResultStub({ id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useWardDetailBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.requestDetail({ wardResultId: wardResult.id });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'ward-detail-response',
              wardResultId: otherWardResult.id,
              detail: 'wrong-detail',
            }),
          });
        },
      });

      expect({ detail: result.current.detail, loading: result.current.loading }).toStrictEqual({
        detail: null,
        loading: true,
      });
    });

    it('EDGE: {unrelated message type} => does not update detail', () => {
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

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              wardResultId: wardResult.id,
              detail: 'should-not-appear',
            }),
          });
        },
      });

      expect({ detail: result.current.detail, loading: result.current.loading }).toStrictEqual({
        detail: null,
        loading: true,
      });
    });
  });
});
