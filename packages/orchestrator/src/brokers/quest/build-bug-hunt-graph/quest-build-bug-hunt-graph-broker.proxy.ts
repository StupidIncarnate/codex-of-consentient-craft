import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const questBuildBugHuntGraphBrokerProxy = (): {
  setupUuidQueue: (params: { uuids: readonly string[] }) => void;
} => {
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });

  return {
    setupUuidQueue: ({ uuids }: { uuids: readonly string[] }): void => {
      for (const id of uuids) {
        uuidSpy.mockReturnValueOnce(id as ReturnType<typeof crypto.randomUUID>);
      }
    },
  };
};
