/**
 * PURPOSE: Proxy for ward-list-adapter that mocks the ward storage and list transformer packages
 *
 * USAGE:
 * const proxy = wardListAdapterProxy();
 * proxy.setupStorageReturns({ wardResult: WardResultStub() });
 */

import * as WardStorage from '@dungeonmaster/ward/dist/brokers/storage/load/storage-load-broker';
import * as WardListTransformer from '@dungeonmaster/ward/dist/transformers/result-to-list/result-to-list-transformer';
import type { WardResult } from '@dungeonmaster/ward/dist/contracts/ward-result/ward-result-contract';
import type { WardErrorList } from '@dungeonmaster/ward/dist/contracts/ward-error-list/ward-error-list-contract';

jest.mock('@dungeonmaster/ward/dist/brokers/storage/load/storage-load-broker');
jest.mock('@dungeonmaster/ward/dist/transformers/result-to-list/result-to-list-transformer');

export const wardListAdapterProxy = (): {
  setupStorageReturns: (params: { wardResult: WardResult | null }) => void;
  setupListReturns: (params: { list: WardErrorList }) => void;
  setupStorageThrows: (params: { error: Error }) => void;
} => {
  const storageMock = jest.mocked(WardStorage.storageLoadBroker);
  const listMock = jest.mocked(WardListTransformer.resultToListTransformer);

  storageMock.mockResolvedValue(null);
  listMock.mockReturnValue('' as WardErrorList);

  return {
    setupStorageReturns: ({ wardResult }: { wardResult: WardResult | null }): void => {
      storageMock.mockResolvedValueOnce(wardResult);
    },
    setupListReturns: ({ list }: { list: WardErrorList }): void => {
      listMock.mockReturnValueOnce(list);
    },
    setupStorageThrows: ({ error }: { error: Error }): void => {
      storageMock.mockRejectedValueOnce(error);
    },
  };
};
