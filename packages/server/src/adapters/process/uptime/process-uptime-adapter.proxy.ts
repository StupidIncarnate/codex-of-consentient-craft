import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const processUptimeAdapterProxy = (): {
  returns: ({ seconds }: { seconds: number }) => void;
} => {
  const spy = registerSpyOn({ object: process, method: 'uptime' });

  return {
    returns: ({ seconds }: { seconds: number }): void => {
      spy.calledWith([]).returns(seconds);
    },
  };
};
