// Reading the real `process.stdin` opens Node's stdin handle, and under a piped parent (ward inside
// a consumer, CI) that handle is a live PIPEWRAP that outlives the suite. So the proxy swaps the
// `process.stdin` property for a plain object carrying only the flag, never touching the real one.
const stageIsTty = ({ value }: { value: boolean }): void => {
  const stubStdin = { isTTY: value };
  Object.defineProperty(process, 'stdin', { configurable: true, get: () => stubStdin });
};

// Creating it resets the flag to a non-terminal, so one test's staging never leaks into the next.
export const stdinIsTtyProxy = (): {
  setupIsTty: (params: { value: boolean }) => void;
} => {
  stageIsTty({ value: false });

  return {
    setupIsTty: stageIsTty,
  };
};
