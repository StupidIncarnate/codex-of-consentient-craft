import { XMLHttpRequest } from './XMLHttpRequest';

// Captured at module scope, alongside the gateway file's own `export const { XMLHttpRequest } =
// globalThis;` — both run before any `beforeAll` hook fires. MSW's endpoint-mock setup (wired into
// every package's `setupFilesAfterEnv`) patches `globalThis.XMLHttpRequest` with an interceptor
// inside its own `beforeAll`, which runs AFTER both this capture and the gateway file's — so
// reading `globalThis.XMLHttpRequest` fresh inside `it()` would compare the gateway's pre-patch
// reference against the test's post-patch one and fail on an unrelated MSW side effect, not a
// pass-through bug.
const environmentXMLHttpRequest = globalThis.XMLHttpRequest;

describe('#gateway/browser/XMLHttpRequest', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(XMLHttpRequest).toBe(environmentXMLHttpRequest);
  });
});
