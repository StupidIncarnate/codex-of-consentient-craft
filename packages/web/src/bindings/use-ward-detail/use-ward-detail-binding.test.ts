import { QuestIdStub, WardResultStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';

import { useWardDetailBinding } from './use-ward-detail-binding';
import { useWardDetailBindingProxy } from './use-ward-detail-binding.proxy';

describe('useWardDetailBinding', () => {
  describe('initial state', () => {
    it('EMPTY: {questId} => returns null detail and not loading', () => {
      const proxy = useWardDetailBindingProxy();
      proxy.setupConnectedChannel();
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
      proxy.setupConnectedChannel();
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
      proxy.setupConnectedChannel();
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
      proxy.setupConnectedChannel();
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
          proxy.deliverWsMessage({
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

    it('EDGE: {non-matching wardResultId response} => does not update detail, loading stays true', () => {
      const proxy = useWardDetailBindingProxy();
      proxy.setupConnectedChannel();
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
          proxy.deliverWsMessage({
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
      proxy.setupConnectedChannel();
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
          proxy.deliverWsMessage({
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

  describe('second requestDetail cancels first subscription', () => {
    it('VALID: {second requestDetail replaces first} => only second request resolves', () => {
      const proxy = useWardDetailBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardResult1 = WardResultStub({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const wardResult2 = WardResultStub({ id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const detail2 = 'detail-for-id2';

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useWardDetailBinding({ questId }),
      });

      // First request — starts a subscription for wardResult1
      testingLibraryActAdapter({
        callback: () => {
          result.current.requestDetail({ wardResultId: wardResult1.id });
        },
      });

      // Second request — cancels first subscription, starts one for wardResult2
      testingLibraryActAdapter({
        callback: () => {
          result.current.requestDetail({ wardResultId: wardResult2.id });
        },
      });

      // Response for wardResult2 arrives — should resolve since it is the active subscription
      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'ward-detail-response',
              wardResultId: wardResult2.id,
              detail: detail2,
            }),
          });
        },
      });

      expect({ detail: result.current.detail, loading: result.current.loading }).toStrictEqual({
        detail: detail2,
        loading: false,
      });
    });
  });
});
