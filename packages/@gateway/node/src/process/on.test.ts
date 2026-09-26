import { on } from './on';
import { onProxy } from './on.proxy';

describe('on', () => {
  it('VALID: {signal: SIGINT, handler} => registers the handler via process.on and returns process', () => {
    const proxy = onProxy();
    const handler = (): void => undefined;

    const result = on('SIGINT', handler);

    expect(result).toBe(process);
    expect([...proxy.callsMatching()]).toStrictEqual([['SIGINT', handler]]);
  });
});
