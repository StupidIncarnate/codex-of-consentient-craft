import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

export const rawLineToChatEntriesTransformerProxy = (): {
  setupUuids: (params: {
    uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  setupTimestamps: (params: { timestamps: readonly string[] }) => void;
} => {
  const uuidMock: SpyOnHandle = registerSpyOn({ object: crypto, method: 'randomUUID' });
  const dateMock: SpyOnHandle = registerSpyOn({ object: Date.prototype, method: 'toISOString' });

  return {
    setupUuids: ({
      uuids,
    }: {
      uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      for (const uuid of uuids) {
        uuidMock.mockReturnValueOnce(uuid);
      }
    },
    setupTimestamps: ({ timestamps }: { timestamps: readonly string[] }): void => {
      for (const timestamp of timestamps) {
        dateMock.mockReturnValueOnce(timestamp);
      }
    },
  };
};
