import { webBundleResponseBroker } from './web-bundle-response-broker';
import { webBundleResponseBrokerProxy } from './web-bundle-response-broker.proxy';

describe('webBundleResponseBroker', () => {
  it('VALID: {pathname: "/"} => serves index.html as text/html at 200', async () => {
    const proxy = webBundleResponseBrokerProxy();
    const contents = '<!doctype html><title>DM</title>';
    proxy.setupFileContents({ contents, expectedRelativePath: '/index.html' });

    const result = await webBundleResponseBroker({ pathname: '/' });

    expect(result).toStrictEqual({
      body: contents,
      contentType: 'text/html; charset=utf-8',
      status: 200,
    });
  });

  it('VALID: {pathname: "/codex/quest/abc-123"} => SPA fallback to index.html (text/html, 200)', async () => {
    const proxy = webBundleResponseBrokerProxy();
    const contents = '<!doctype html>';
    proxy.setupFileContents({ contents, expectedRelativePath: '/index.html' });

    const result = await webBundleResponseBroker({ pathname: '/codex/quest/abc-123' });

    expect(result).toStrictEqual({
      body: contents,
      contentType: 'text/html; charset=utf-8',
      status: 200,
    });
  });

  it('VALID: {pathname: "/assets/index-abc.js"} => serves the JS asset as text/javascript at 200', async () => {
    const proxy = webBundleResponseBrokerProxy();
    const contents = 'console.log(1)';
    proxy.setupFileContents({ contents, expectedRelativePath: '/assets/index-abc.js' });

    const result = await webBundleResponseBroker({ pathname: '/assets/index-abc.js' });

    expect(result).toStrictEqual({
      body: contents,
      contentType: 'text/javascript; charset=utf-8',
      status: 200,
    });
  });

  it('VALID: {pathname: "/favicon.svg"} => serves the root static file as image/svg+xml at 200', async () => {
    const proxy = webBundleResponseBrokerProxy();
    const contents = '<svg viewBox="0 0 16 16"></svg>';
    proxy.setupFileContents({ contents, expectedRelativePath: '/favicon.svg' });

    const result = await webBundleResponseBroker({ pathname: '/favicon.svg' });

    expect(result).toStrictEqual({
      body: contents,
      contentType: 'image/svg+xml',
      status: 200,
    });
  });

  it('EDGE: {pathname: "/logo.svg" not a named root file} => SPA fallback to index.html', async () => {
    const proxy = webBundleResponseBrokerProxy();
    const contents = '<!doctype html>';
    proxy.setupFileContents({ contents, expectedRelativePath: '/index.html' });

    const result = await webBundleResponseBroker({ pathname: '/logo.svg' });

    expect(result).toStrictEqual({
      body: contents,
      contentType: 'text/html; charset=utf-8',
      status: 200,
    });
  });

  it('EDGE: {pathname: "/assets/../secret" traversal} => treated as SPA route (index.html)', async () => {
    const proxy = webBundleResponseBrokerProxy();
    const contents = '<!doctype html>';
    proxy.setupFileContents({ contents, expectedRelativePath: '/index.html' });

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
      body: 'Dungeonmaster web bundle not found. Build it with `npm run build` before starting the server.',
      contentType: 'text/plain; charset=utf-8',
      status: 500,
    });
  });

  it('VALID: {pathname: "/assets/app.js"} => reads from distPath joined with relativePath', async () => {
    const proxy = webBundleResponseBrokerProxy();
    const contents = 'console.log("app")';
    proxy.setupFileContents({ contents, expectedRelativePath: '/assets/app.js' });

    const result = await webBundleResponseBroker({ pathname: '/assets/app.js' });

    expect(result).toStrictEqual({
      body: contents,
      contentType: 'text/javascript; charset=utf-8',
      status: 200,
    });
  });
});
