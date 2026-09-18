// PURPOSE: Builds a BrowserSession whose `pressKey` is a jest.fn(), and exposes
// the call list and a method to stage the returned KeyReading so a test can assert what was pressed.
// USAGE: const proxy = stepKeyBrokerProxy(); const { session, getPressKeyCalls, setKeyReading } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { KeyReadingStub } from '../../../contracts/key-reading/key-reading.stub';

type BrowserSession = ReturnType<typeof BrowserSessionStub>;
type KeyReading = ReturnType<typeof KeyReadingStub>;

export const stepKeyBrokerProxy = (): {
  session: () => {
    session: BrowserSession;
    getPressKeyCalls: () => readonly unknown[];
    setKeyReading: (reading: KeyReading) => void;
  };
} => ({
  session: (): {
    session: BrowserSession;
    getPressKeyCalls: () => readonly unknown[];
    setKeyReading: (reading: KeyReading) => void;
  } => {
    const state = {
      reading: KeyReadingStub(),
    };
    const pressKey = jest.fn().mockImplementation(async () => Promise.resolve(state.reading));
    return {
      session: BrowserSessionStub({ pressKey }),
      getPressKeyCalls: (): readonly unknown[] => pressKey.mock.calls,
      setKeyReading: (reading: KeyReading): void => {
        state.reading = reading;
      },
    };
  },
});
