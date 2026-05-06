import { Subject } from 'rxjs';

import { WsMessageStub } from '@dungeonmaster/shared/contracts';

import { rxjsFilterAdapter } from './rxjs-filter-adapter';
import { rxjsFilterAdapterProxy } from './rxjs-filter-adapter.proxy';

type WsMessage = ReturnType<typeof WsMessageStub>;

describe('rxjsFilterAdapter', () => {
  it('VALID: {predicate matches some} => only matching values reach subscriber', () => {
    rxjsFilterAdapterProxy();

    const source = new Subject<WsMessage>();
    const filtered = rxjsFilterAdapter<WsMessage>({
      source: source.asObservable(),
      predicate: (msg) => msg.type === 'chat-output',
    });

    const received: WsMessage[] = [];
    const sub = filtered.subscribe((value) => {
      received.push(value);
    });

    const a = WsMessageStub({ type: 'phase-change' });
    const b = WsMessageStub({ type: 'chat-output' });
    const c = WsMessageStub({ type: 'chat-complete' });
    const d = WsMessageStub({ type: 'chat-output' });

    source.next(a);
    source.next(b);
    source.next(c);
    source.next(d);

    sub.unsubscribe();

    expect(received).toStrictEqual([b, d]);
  });

  it('VALID: {predicate matches none} => subscriber receives nothing', () => {
    rxjsFilterAdapterProxy();

    const source = new Subject<WsMessage>();
    const filtered = rxjsFilterAdapter<WsMessage>({
      source: source.asObservable(),
      predicate: () => false,
    });

    const received: WsMessage[] = [];
    const sub = filtered.subscribe((value) => {
      received.push(value);
    });

    source.next(WsMessageStub({ type: 'chat-output' }));
    source.next(WsMessageStub({ type: 'chat-complete' }));

    sub.unsubscribe();

    expect(received).toStrictEqual([]);
  });
});
