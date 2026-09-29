// process.env is a plain object, not an npm dependency, so this proxy owns the swap itself rather
// than exposing registerMock: `returns` replaces the whole environment with a staged one, and
// `restore` puts the original property back. Every env wrapper reads process.env at call time, so
// the staged object is what getEnv, setEnv, deleteEnv and envSnapshot all see until restore.
export const envSnapshotProxy = (): {
  returns: (params: { env: Record<string, string> }) => void;
  restore: () => void;
} => {
  const original = Object.getOwnPropertyDescriptor(process, 'env');

  return {
    returns: ({ env }: { env: Record<string, string> }): void => {
      Object.defineProperty(process, 'env', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: { ...env },
      });
    },

    restore: (): void => {
      if (original !== undefined) {
        Object.defineProperty(process, 'env', original);
      }
    },
  };
};
