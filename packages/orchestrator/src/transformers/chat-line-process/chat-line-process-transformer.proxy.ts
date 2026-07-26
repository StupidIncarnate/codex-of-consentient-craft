import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

export const chatLineProcessTransformerProxy = (): {
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
        // crypto.randomUUID takes no arguments, so [] is the only possible address. Successive
        // calls within one transformer run need different results, which is what onceFor is for.
        uuidMock.onceFor([]).returns(uuid);
      }
    },
  };
};
