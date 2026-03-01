/**
 * PURPOSE: Test setup helper for ward handle responder
 *
 * USAGE:
 * const proxy = WardHandleResponderProxy();
 * const result = await proxy.callResponder({ tool: ToolNameStub({ value: 'ward-list' }), args: {} });
 */

import { wardListAdapterProxy } from '../../../adapters/ward/list/ward-list-adapter.proxy';
import { wardDetailAdapterProxy } from '../../../adapters/ward/detail/ward-detail-adapter.proxy';
import { wardRawAdapterProxy } from '../../../adapters/ward/raw/ward-raw-adapter.proxy';
import { WardHandleResponder } from './ward-handle-responder';

export const WardHandleResponderProxy = (): {
  callResponder: typeof WardHandleResponder;
  setupListStorageThrows: (params: { error: Error }) => void;
  setupDetailStorageThrows: (params: { error: Error }) => void;
  setupRawStorageThrows: (params: { error: Error }) => void;
} => {
  const listProxy = wardListAdapterProxy();
  const detailProxy = wardDetailAdapterProxy();
  const rawProxy = wardRawAdapterProxy();

  return {
    callResponder: WardHandleResponder,

    setupListStorageThrows: ({ error }: { error: Error }): void => {
      listProxy.setupStorageThrows({ error });
    },

    setupDetailStorageThrows: ({ error }: { error: Error }): void => {
      detailProxy.setupStorageThrows({ error });
    },

    setupRawStorageThrows: ({ error }: { error: Error }): void => {
      rawProxy.setupStorageThrows({ error });
    },
  };
};
