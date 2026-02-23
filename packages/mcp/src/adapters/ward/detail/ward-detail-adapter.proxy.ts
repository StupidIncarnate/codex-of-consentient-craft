/**
 * PURPOSE: Proxy for ward-detail-adapter that mocks the ward storage and detail transformer packages
 *
 * USAGE:
 * const proxy = wardDetailAdapterProxy();
 * proxy.setupStorageReturns({ wardResult: WardResultStub() });
 */

import * as WardStorage from '@dungeonmaster/ward/dist/brokers/storage/load/storage-load-broker';
import * as WardDetailTransformer from '@dungeonmaster/ward/dist/transformers/result-to-detail/result-to-detail-transformer';
import type { WardResult } from '@dungeonmaster/ward/dist/contracts/ward-result/ward-result-contract';
import type { WardFileDetail } from '@dungeonmaster/ward/dist/contracts/ward-file-detail/ward-file-detail-contract';

jest.mock('@dungeonmaster/ward/dist/brokers/storage/load/storage-load-broker');
jest.mock('@dungeonmaster/ward/dist/transformers/result-to-detail/result-to-detail-transformer');

export const wardDetailAdapterProxy = (): {
  setupStorageReturns: (params: { wardResult: WardResult | null }) => void;
  setupDetailReturns: (params: { detail: WardFileDetail }) => void;
  setupStorageThrows: (params: { error: Error }) => void;
} => {
  const storageMock = jest.mocked(WardStorage.storageLoadBroker);
  const detailMock = jest.mocked(WardDetailTransformer.resultToDetailTransformer);

  storageMock.mockResolvedValue(null);
  detailMock.mockReturnValue('' as WardFileDetail);

  return {
    setupStorageReturns: ({ wardResult }: { wardResult: WardResult | null }): void => {
      storageMock.mockResolvedValueOnce(wardResult);
    },
    setupDetailReturns: ({ detail }: { detail: WardFileDetail }): void => {
      detailMock.mockReturnValueOnce(detail);
    },
    setupStorageThrows: ({ error }: { error: Error }): void => {
      storageMock.mockRejectedValueOnce(error);
    },
  };
};
