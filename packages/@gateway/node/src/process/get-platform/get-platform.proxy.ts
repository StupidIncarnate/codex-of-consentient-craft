const REAL_PLATFORM = process.platform;

const stagePlatform = ({ value }: { value: NodeJS.Platform }): void => {
  Object.defineProperty(process, 'platform', { configurable: true, value });
};

// process.platform is a plain property, not an npm dependency, so the proxy owns the swap.
// Creating it restores the real platform, so one test's staging never leaks into the next.
export const getPlatformProxy = (): {
  setupPlatform: (params: { value: NodeJS.Platform }) => void;
} => {
  stagePlatform({ value: REAL_PLATFORM });

  return {
    setupPlatform: stagePlatform,
  };
};
