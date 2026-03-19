/**
 * PURPOSE: Test setup helper for ward handle responder
 *
 * USAGE:
 * const proxy = WardHandleResponderProxy();
 * const result = await proxy.callResponder({ tool: ToolNameStub({ value: 'ward-detail' }), args: {} });
 */

import { wardDetailAdapterProxy } from '../../../adapters/ward/detail/ward-detail-adapter.proxy';
import { WardHandleResponder } from './ward-handle-responder';

export const WardHandleResponderProxy = (): {
  callResponder: typeof WardHandleResponder;
  setupDetailStorageThrows: (params: { error: Error }) => void;
} => {
  const detailProxy = wardDetailAdapterProxy();

  return {
    callResponder: WardHandleResponder,

    setupDetailStorageThrows: ({ error }: { error: Error }): void => {
      detailProxy.setupStorageThrows({ error });
    },
  };
};
