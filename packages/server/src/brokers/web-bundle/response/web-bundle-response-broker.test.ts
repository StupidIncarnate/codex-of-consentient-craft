import { webBundleResponseBroker } from './web-bundle-response-broker';
import { webBundleResponseBrokerProxy } from './web-bundle-response-broker.proxy';
import { FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('webBundleResponseBroker', () => {
  it('VALID: {pathname: "/"} => serves index.html as text/html at 200', async () => {
    const proxy = webBundleResponseBrokerProxy();
    const contents = FileContentsStub({ value: '<!doctype html><title>DM</title>' });
    proxy.setupFileContents({ contents });

    const result = await webBundleResponseBroker({ pathname: '/' });

    expect(result).toStrictEqual({
      body: contents,
      contentType: 'text/html; charset=utf-8',
      status: 200,
    });
  });

  it('VALID: {pathname: "/codex/quest/abc-123"} => SPA fallback to index.html (text/html, 200)', async () => {
    const proxy = webBundleResponseBrokerProxy();
    const contents = FileContentsStub({ value: '<!doctype html>' });
    proxy.setupFileContents({ contents });

    const result = await webBundleResponseBroker({ pathname: '/codex/quest/abc-123' });

    expect(result).toStrictEqual({
      body: contents,
      contentType: 'text/html; charset=utf-8',
      status: 200,
    });
  });

  it('VALID: {pathname: "/assets/index-abc.js"} => serves the JS asset as text/javascript at 200', async () => {
    const proxy = webBundleResponseBrokerProxy();
    const contents = FileContentsStub({ value: 'console.log(1)' });
    proxy.setupFileContents({ contents });

    const result = await webBundleResponseBroker({ pathname: '/assets/index-abc.js' });

    expect(result).toStrictEqual({
      body: contents,
      contentType: 'text/javascript; charset=utf-8',
      status: 200,
    });
  });

  it('EDGE: {pathname: "/assets/../secret" traversal} => treated as SPA route (index.html)', async () => {
    const proxy = webBundleResponseBrokerProxy();
    const contents = FileContentsStub({ value: '<!doctype html>' });
    proxy.setupFileContents({ contents });

    const result = await webBundleResponseBroker({ pathname: '/assets/../secret' });

    expect(result).toStrictEqual({
      body: contents,
      contentType: 'text/html; charset=utf-8',
      status: 200,
    });
  });

  it('ERROR: {web bundle missing} => 500 with plain-text message', async () => {
    const proxy = webBundleResponseBrokerProxy();
    proxy.setupMissingBundle();

    const result = await webBundleResponseBroker({ pathname: '/' });

    expect(result).toStrictEqual({
      body: FileContentsStub({
        value:
          'Dungeonmaster web bundle not found. Build it with `npm run build` before starting the server.',
      }),
      contentType: 'text/plain; charset=utf-8',
      status: 500,
    });
  });
});
