import { SiegelenseRunResponderProxy } from './siegelense-run-responder.proxy';

describe('SiegelenseRunResponder', () => {
  it('VALID: {input: "example"} => writes "siegelense run: example" to stdout', async () => {
    const proxy = SiegelenseRunResponderProxy();

    await proxy.callResponder({ input: 'example' });

    expect(proxy.capturedOutput()).toStrictEqual(['siegelense run: example\n']);
  });
});
