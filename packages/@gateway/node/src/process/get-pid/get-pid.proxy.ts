const REAL_PID = process.pid;

const stagePid = ({ pid }: { pid: number }): void => {
  Object.defineProperty(process, 'pid', { configurable: true, value: pid });
};

// process.pid is a plain property, not an npm dependency, so the proxy owns the swap. Creating it
// restores the real pid, so one test's staging never leaks into the next.
export const getPidProxy = (): {
  setupPid: (params: { pid: number }) => void;
} => {
  stagePid({ pid: REAL_PID });

  return {
    setupPid: stagePid,
  };
};
