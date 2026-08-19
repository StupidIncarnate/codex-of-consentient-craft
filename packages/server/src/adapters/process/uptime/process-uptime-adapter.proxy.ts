import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const processUptimeAdapterProxy = (): {
  returnsSeconds: (params: { seconds: number }) => void;
} => {
  const spy = registerSpyOn({ object: process, method: 'uptime' });

  return {
    // uptime takes no argument — [] is the honest address, not a lazy catch-all.
    returnsSeconds: ({ seconds }: { seconds: number }): void => {
      spy.calledWith([]).returns(seconds);
    },
  };
};
