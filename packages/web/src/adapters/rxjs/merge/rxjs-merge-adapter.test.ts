import { Subject } from 'rxjs';

import { WsMessageStub } from '@dungeonmaster/shared/contracts';

import { rxjsMergeAdapter } from './rxjs-merge-adapter';
import { rxjsMergeAdapterProxy } from './rxjs-merge-adapter.proxy';

type WsMessage = ReturnType<typeof WsMessageStub>;

describe('rxjsMergeAdapter', () => {
  it('VALID: {two sources} => subscriber receives emissions from both in interleaved order', () => {
    rxjsMergeAdapterProxy();

    const a = new Subject<WsMessage>();
    const b = new Subject<WsMessage>();
    const combined = rxjsMergeAdapter<WsMessage>({
      sources: [a.asObservable(), b.asObservable()],
    });

    const received: WsMessage[] = [];
    const sub = combined.subscribe((value) => {
      received.push(value);
    });

    const aOne = WsMessageStub({ type: 'phase-change' });
    const bOne = WsMessageStub({ type: 'chat-output' });
    const aTwo = WsMessageStub({ type: 'chat-complete' });

    a.next(aOne);
    b.next(bOne);
    a.next(aTwo);

    sub.unsubscribe();

    expect(received).toStrictEqual([aOne, bOne, aTwo]);
  });

  it('VALID: {empty sources array} => subscriber receives nothing and stream completes', () => {
    rxjsMergeAdapterProxy();

    const combined = rxjsMergeAdapter<WsMessage>({ sources: [] });

    const received: WsMessage[] = [];
    let completed = false;
    const sub = combined.subscribe({
      next: (value) => {
        received.push(value);
      },
      complete: () => {
        completed = true;
      },
    });

    sub.unsubscribe();

    expect(received).toStrictEqual([]);
    expect(completed).toBe(true);
  });
});
