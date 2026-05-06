import { WsMessageStub } from '@dungeonmaster/shared/contracts';

import { rxjsSubjectAdapter } from './rxjs-subject-adapter';
import { rxjsSubjectAdapterProxy } from './rxjs-subject-adapter.proxy';

type WsMessage = ReturnType<typeof WsMessageStub>;

describe('rxjsSubjectAdapter', () => {
  it('VALID: {single subscriber} => receives every emission', () => {
    rxjsSubjectAdapterProxy();

    const subject = rxjsSubjectAdapter<WsMessage>();
    const received: WsMessage[] = [];
    const a = WsMessageStub({ type: 'phase-change' });
    const b = WsMessageStub({ type: 'chat-output' });
    const c = WsMessageStub({ type: 'chat-complete' });

    const sub = subject.observable.subscribe((value) => {
      received.push(value);
    });

    subject.next(a);
    subject.next(b);
    subject.next(c);

    sub.unsubscribe();

    expect(received).toStrictEqual([a, b, c]);
  });

  it('VALID: {multiple subscribers} => each receives every emission (multicast)', () => {
    rxjsSubjectAdapterProxy();

    const subject = rxjsSubjectAdapter<WsMessage>();
    const aReceived: WsMessage[] = [];
    const bReceived: WsMessage[] = [];
    const one = WsMessageStub({ type: 'chat-output' });
    const two = WsMessageStub({ type: 'chat-complete' });

    const subA = subject.observable.subscribe((value) => {
      aReceived.push(value);
    });
    const subB = subject.observable.subscribe((value) => {
      bReceived.push(value);
    });

    subject.next(one);
    subject.next(two);

    subA.unsubscribe();
    subB.unsubscribe();

    expect(aReceived).toStrictEqual([one, two]);
    expect(bReceived).toStrictEqual([one, two]);
  });

  it('VALID: {late subscriber} => receives only emissions made after subscribing (hot, no replay)', () => {
    rxjsSubjectAdapterProxy();

    const subject = rxjsSubjectAdapter<WsMessage>();
    const before = WsMessageStub({ type: 'phase-change' });
    const after = WsMessageStub({ type: 'chat-output' });
    subject.next(before);

    const received: WsMessage[] = [];
    const sub = subject.observable.subscribe((value) => {
      received.push(value);
    });

    subject.next(after);
    sub.unsubscribe();

    expect(received).toStrictEqual([after]);
  });

  it('VALID: {complete called} => subscribers stop receiving emissions', () => {
    rxjsSubjectAdapterProxy();

    const subject = rxjsSubjectAdapter<WsMessage>();
    const received: WsMessage[] = [];
    const before = WsMessageStub({ type: 'chat-output' });
    const after = WsMessageStub({ type: 'chat-complete' });

    const sub = subject.observable.subscribe((value) => {
      received.push(value);
    });

    subject.next(before);
    subject.complete();
    subject.next(after);

    sub.unsubscribe();

    expect(received).toStrictEqual([before]);
  });

  it('VALID: {unsubscribed subscriber} => stops receiving but other subscribers continue', () => {
    rxjsSubjectAdapterProxy();

    const subject = rxjsSubjectAdapter<WsMessage>();
    const aReceived: WsMessage[] = [];
    const bReceived: WsMessage[] = [];
    const one = WsMessageStub({ type: 'phase-change' });
    const two = WsMessageStub({ type: 'chat-output' });

    const subA = subject.observable.subscribe((value) => {
      aReceived.push(value);
    });
    const subB = subject.observable.subscribe((value) => {
      bReceived.push(value);
    });

    subject.next(one);
    subA.unsubscribe();
    subject.next(two);
    subB.unsubscribe();

    expect(aReceived).toStrictEqual([one]);
    expect(bReceived).toStrictEqual([one, two]);
  });
});
