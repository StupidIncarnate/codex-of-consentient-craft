const stageIsTty = ({ value }: { value: boolean }): void => {
  Object.defineProperty(process.stdin, 'isTTY', { configurable: true, writable: true, value });
};

// process.stdin.isTTY is a plain property, not an npm dependency, so the proxy owns the swap.
// Creating it resets the flag to a non-terminal, so one test's staging never leaks into the next.
export const stdinIsTtyProxy = (): {
  setupIsTty: (params: { value: boolean }) => void;
} => {
  stageIsTty({ value: false });

  return {
    setupIsTty: stageIsTty,
  };
};
