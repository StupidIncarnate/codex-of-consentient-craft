import { Subject } from 'rxjs';

import { WsMessageStub } from '@dungeonmaster/shared/contracts';

import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { rxjsTimeoutAdapter } from './rxjs-timeout-adapter';
import { rxjsTimeoutAdapterProxy } from './rxjs-timeout-adapter.proxy';

type WsMessage = ReturnType<typeof WsMessageStub>;

describe('rxjsTimeoutAdapter', () => {
  it('VALID: {emission within window} => subscriber receives value', () => {
    rxjsTimeoutAdapterProxy();
    jest.useFakeTimers();

    const source = new Subject<WsMessage>();
    const guarded = rxjsTimeoutAdapter<WsMessage>({
      source: source.asObservable(),
      durationMs: TimeoutMsStub({ value: 1000 }),
    });

    let receivedValue: WsMessage | null = null;
    let errored = false;
    const sub = guarded.subscribe({
      next: (value) => {
        receivedValue = value;
      },
      error: () => {
        errored = true;
      },
    });

    const message = WsMessageStub({ type: 'chat-output' });
    source.next(message);

    sub.unsubscribe();
    jest.useRealTimers();

    expect(receivedValue).toStrictEqual(message);
    expect(errored).toBe(false);
  });

  it('VALID: {no emission within window} => subscriber receives error', () => {
    rxjsTimeoutAdapterProxy();
    jest.useFakeTimers();

    const source = new Subject<WsMessage>();
    const guarded = rxjsTimeoutAdapter<WsMessage>({
      source: source.asObservable(),
      durationMs: TimeoutMsStub({ value: 1000 }),
    });

    let errored = false;
    const sub = guarded.subscribe({
      next: () => {
        // never called
      },
      error: () => {
        errored = true;
      },
    });

    jest.advanceTimersByTime(1500);

    sub.unsubscribe();
    jest.useRealTimers();

    expect(errored).toBe(true);
  });
});
