// PURPOSE: Builds a BrowserSession whose `videoAction` is a jest.fn(), and exposes its call list
// so a test can assert the exact `{action}` stepVideoBroker drove it with, and customize the returned VideoResult.
// USAGE: const proxy = stepVideoBrokerProxy(); const { session, getVideoActionCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { VideoResultStub } from '../../../contracts/video-result/video-result.stub';

type BrowserSession = ReturnType<typeof BrowserSessionStub>;
type VideoResult = ReturnType<typeof VideoResultStub>;

export const stepVideoBrokerProxy = (): {
  session: (params?: { result?: VideoResult }) => {
    session: BrowserSession;
    getVideoActionCalls: () => readonly unknown[];
  };
} => ({
  session: (params?: {
    result?: VideoResult;
  }): {
    session: BrowserSession;
    getVideoActionCalls: () => readonly unknown[];
  } => {
    const videoAction = jest
      .fn()
      .mockResolvedValue(params?.result ?? VideoResultStub({ status: 'started', path: null }));

    return {
      session: BrowserSessionStub({ videoAction }),
      getVideoActionCalls: (): readonly unknown[] => videoAction.mock.calls,
    };
  },
});
