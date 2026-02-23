/**
 * PURPOSE: Proxy for ward-raw-adapter that mocks the ward storage package
 *
 * USAGE:
 * const proxy = wardRawAdapterProxy();
 * proxy.setupStorageReturns({ wardResult: WardResultStub() });
 */

import * as WardStorage from '@dungeonmaster/ward/dist/brokers/storage/load/storage-load-broker';
import type { WardResult } from '@dungeonmaster/ward/dist/contracts/ward-result/ward-result-contract';

jest.mock('@dungeonmaster/ward/dist/brokers/storage/load/storage-load-broker');

export const wardRawAdapterProxy = (): {
  setupStorageReturns: (params: { wardResult: WardResult | null }) => void;
  setupStorageThrows: (params: { error: Error }) => void;
} => {
  const storageMock = jest.mocked(WardStorage.storageLoadBroker);

  storageMock.mockResolvedValue(null);

  return {
    setupStorageReturns: ({ wardResult }: { wardResult: WardResult | null }): void => {
      storageMock.mockResolvedValueOnce(wardResult);
    },
    setupStorageThrows: ({ error }: { error: Error }): void => {
      storageMock.mockRejectedValueOnce(error);
    },
  };
};
