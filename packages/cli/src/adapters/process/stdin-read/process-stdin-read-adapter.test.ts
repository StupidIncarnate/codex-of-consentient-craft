import { processStdinReadAdapter } from './process-stdin-read-adapter';
import { processStdinReadAdapterProxy } from './process-stdin-read-adapter.proxy';

describe('processStdinReadAdapter', () => {
  it('VALID: {stdin: "hello"} => returns "hello"', async () => {
    const proxy = processStdinReadAdapterProxy();
    proxy.setupStdin({ data: 'hello' });

    const result = await processStdinReadAdapter();
    proxy.restore();

    expect(result).toBe('hello');
  });

  it('VALID: {stdin: JSON} => returns JSON string verbatim', async () => {
    const proxy = processStdinReadAdapterProxy();
    const data = '{"rate_limits":{"five_hour":{"used_percentage":42}}}';
    proxy.setupStdin({ data });

    const result = await processStdinReadAdapter();
    proxy.restore();

    expect(result).toBe(data);
  });

  it('EMPTY: {stdin: ""} => returns empty string', async () => {
    const proxy = processStdinReadAdapterProxy();
    proxy.setupStdin({ data: '' });

    const result = await processStdinReadAdapter();
    proxy.restore();

    expect(result).toBe('');
  });
});
