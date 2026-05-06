import { WsMessageStub } from '@dungeonmaster/shared/contracts';

import { rxjsOfAdapter } from './rxjs-of-adapter';
import { rxjsOfAdapterProxy } from './rxjs-of-adapter.proxy';

type WsMessage = ReturnType<typeof WsMessageStub>;

describe('rxjsOfAdapter', () => {
  it('VALID: {value provided} => subscriber receives the value once and stream completes', () => {
    rxjsOfAdapterProxy();

    const value = WsMessageStub({ type: 'phase-change' });
    const stream = rxjsOfAdapter<WsMessage>({ value });

    const received: WsMessage[] = [];
    let completed = false;
    const sub = stream.subscribe({
      next: (v) => {
        received.push(v);
      },
      complete: () => {
        completed = true;
      },
    });

    sub.unsubscribe();

    expect(received).toStrictEqual([value]);
    expect(completed).toBe(true);
  });
});
