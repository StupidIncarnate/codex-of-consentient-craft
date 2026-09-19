// PURPOSE: Builds a BrowserSession whose `addInitScript` is a jest.fn(), and exposes its call list
// so a test can assert the exact `{source}` stepBeforeBroker drove it with.
// USAGE: const proxy = stepBeforeBrokerProxy(); const { session, getAddInitScriptCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';

type BrowserSession = ReturnType<typeof BrowserSessionStub>;

export const stepBeforeBrokerProxy = (): {
  session: () => { session: BrowserSession; getAddInitScriptCalls: () => readonly unknown[] };
} => ({
  session: (): { session: BrowserSession; getAddInitScriptCalls: () => readonly unknown[] } => {
    const addInitScript = jest.fn().mockResolvedValue(undefined);

    return {
      session: BrowserSessionStub({ addInitScript }),
      getAddInitScriptCalls: (): readonly unknown[] => addInitScript.mock.calls,
    };
  },
});
