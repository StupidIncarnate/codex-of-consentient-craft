import { Subject } from 'rxjs';

import { WsMessageStub } from '@dungeonmaster/shared/contracts';

import { TakeCountStub } from '../../../contracts/take-count/take-count.stub';
import { rxjsTakeAdapter } from './rxjs-take-adapter';
import { rxjsTakeAdapterProxy } from './rxjs-take-adapter.proxy';

type WsMessage = ReturnType<typeof WsMessageStub>;

describe('rxjsTakeAdapter', () => {
  it('VALID: {count: 1} => completes after first emission', () => {
    rxjsTakeAdapterProxy();

    const source = new Subject<WsMessage>();
    const limited = rxjsTakeAdapter<WsMessage>({
      source: source.asObservable(),
      count: TakeCountStub({ value: 1 }),
    });

    const received: WsMessage[] = [];
    let completed = false;
    const sub = limited.subscribe({
      next: (value) => {
        received.push(value);
      },
      complete: () => {
        completed = true;
      },
    });

    const a = WsMessageStub({ type: 'phase-change' });
    const b = WsMessageStub({ type: 'chat-output' });

    source.next(a);
    source.next(b);

    sub.unsubscribe();

    expect(received).toStrictEqual([a]);
    expect(completed).toBe(true);
  });

  it('VALID: {count: 2} => completes after second emission', () => {
    rxjsTakeAdapterProxy();

    const source = new Subject<WsMessage>();
    const limited = rxjsTakeAdapter<WsMessage>({
      source: source.asObservable(),
      count: TakeCountStub({ value: 2 }),
    });

    const received: WsMessage[] = [];
    let completed = false;
    const sub = limited.subscribe({
      next: (value) => {
        received.push(value);
      },
      complete: () => {
        completed = true;
      },
    });

    const a = WsMessageStub({ type: 'phase-change' });
    const b = WsMessageStub({ type: 'chat-output' });
    const c = WsMessageStub({ type: 'chat-complete' });

    source.next(a);
    source.next(b);
    source.next(c);

    sub.unsubscribe();

    expect(received).toStrictEqual([a, b]);
    expect(completed).toBe(true);
  });
});
