import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

// write returns nothing a caller branches on, so there is no argument to key on: the fake
// records every chunk in call order (nothing reaches the real stream) and the read-backs hand
// them back, the same shape exit, kill and on use.
export const stdoutProxy = (): {
  getWrites: () => readonly unknown[];
  getWrittenText: () => string;
} => {
  const handle = registerSpyOn({ object: process.stdout, method: 'write' });
  handle.calledWith([]).returns(true);

  const getWrites = (): readonly unknown[] => handle.callsMatching([]).map((call) => call[0]);

  return {
    getWrites,
    getWrittenText: (): string =>
      getWrites()
        .map((chunk) => String(chunk))
        .join(''),
  };
};
