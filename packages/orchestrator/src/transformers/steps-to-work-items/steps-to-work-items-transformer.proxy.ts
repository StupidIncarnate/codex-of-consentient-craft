import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

export const stepsToWorkItemsTransformerProxy = (): {
  setupUuids: (params: {
    uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
} => {
  const uuidMock: SpyOnHandle = registerSpyOn({ object: crypto, method: 'randomUUID' });

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
  };
};
