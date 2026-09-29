import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { randomUUID } from '#gateway/node/crypto';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const caseCatalogToBlueprintTransformerProxy = (): {
  setupUuids: (params: {
    uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
} => {
  const uuidMock: MockHandle = registerMock({ fn: randomUUID });

  return {
    setupUuids: ({
      uuids,
    }: {
      uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      for (const uuid of uuids) {
        // randomUUID takes no arguments, so [] is the only possible address. Successive
        // calls within one transformer run need different results, which is what onceFor is for.
        uuidMock.onceFor([]).returns(uuid);
      }
    },
  };
};
