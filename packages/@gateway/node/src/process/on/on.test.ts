import { on } from './on';
import { onProxy } from './on.proxy';

describe('on', () => {
  it('VALID: {event: SIGINT, handler} => registers the handler via process.on and returns process', () => {
    const proxy = onProxy();
    const handler = (): void => undefined;

    const result = on('SIGINT', handler);

    expect(result).toBe(process);
    expect([...proxy.callsMatching()]).toStrictEqual([['SIGINT', handler]]);
  });

  it('VALID: {event: exit, handler taking the exit code} => registers the handler under that event name', () => {
    const proxy = onProxy();
    const handler = (_code: number): void => undefined;

    const result = on('exit', handler);

    expect(result).toBe(process);
    expect([...proxy.callsMatching()]).toStrictEqual([['exit', handler]]);
  });

  it('VALID: {event: a custom name} => registers the handler under that name', () => {
    const proxy = onProxy();
    const handler = (): void => undefined;

    on('dm-gateway-custom-event', handler);

    expect([...proxy.callsMatching()]).toStrictEqual([['dm-gateway-custom-event', handler]]);
  });
});
