import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

// write returns nothing a caller branches on, so there is no argument to key on: the fake
// records every chunk in call order (nothing reaches the real stream) and the read-backs hand
// them back, the same shape exit, kill and on use.
// `stdout` is the real process.stdout object captured at import, so isTTY is staged on that
// object, never by swapping the property on process. Creating the proxy resets the flag to false
// (a non-terminal), so one test's staging never leaks into the next.
const stageIsTty = ({ value }: { value: boolean | undefined }): void => {
  Object.defineProperty(process.stdout, 'isTTY', {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
};

export const stdoutProxy = (): {
  getWrites: () => readonly unknown[];
  getWrittenText: () => string;
  setupIsTty: (params: { value: boolean | undefined }) => void;
} => {
  stageIsTty({ value: false });
  const handle = registerSpyOn({ object: process.stdout, method: 'write' });
  handle.calledWith([]).returns(true);

  const getWrites = (): readonly unknown[] => handle.callsMatching([]).map((call) => call[0]);

  return {
    setupIsTty: stageIsTty,
    getWrites,
    getWrittenText: (): string =>
      getWrites()
        .map((chunk) => String(chunk))
        .join(''),
  };
};
