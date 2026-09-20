import { fetchPostAdapter } from './fetch-post-adapter';
import { apiTargetHarness } from '../../../../test/harnesses/api-target/api-target.harness';

// Real sockets throughout — no `fetch` mock. `fetch-post-adapter.test.ts` beside this one proves the
// adapter's own message-shaping logic given a SUPPLIED shape of failure; it cannot prove a
// connection is truly refused, since a mock always answers something. This suite is what sad-path
// rows 1 and 2 rest on: the OS refuses the socket, and a real `node:http` server writes the body.
describe('fetchPostAdapter (integration — real sockets)', () => {
  const harness = apiTargetHarness();

  it('ERROR: {a port nothing is listening on} => rejects naming the url and the real ECONNREFUSED reason', async () => {
    const url = harness.refusedUrl({ path: '/api/guilds' });

    await expect(fetchPostAdapter({ url, fields: { name: 'Test Guild' } })).rejects.toThrow(
      new RegExp(
        `^POST ${url.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')} refused: connect ECONNREFUSED 127\\.0\\.0\\.1:\\d+$`,
        'u',
      ),
    );
  });

  it('ERROR: {a port nothing is listening on} => the rejection still carries the real url', async () => {
    const url = harness.refusedUrl({ path: '/api/guilds' });

    const rejection: unknown = await fetchPostAdapter({ url, fields: {} }).catch(
      (error: unknown) => error,
    );

    expect((rejection as { url: unknown }).url).toBe(url);
  });

  it('VALID: {a real server answering 500 with a body} => returns the status and the body verbatim, and does not throw', async () => {
    harness.answerNext({ status: 500, body: '{"error":"database unavailable"}' });
    const url = harness.url({ path: '/api/guilds' });

    const result = await fetchPostAdapter({ url, fields: { name: 'Test Guild' } });

    expect(result).toStrictEqual({ url, status: 500, body: '{"error":"database unavailable"}' });
  });

  it('VALID: {a real server answering 201} => returns the status and the created record’s body', async () => {
    harness.answerNext({ status: 201, body: '{"id":"g1","title":"Siege"}' });
    const url = harness.url({ path: '/api/guilds' });

    const result = await fetchPostAdapter({ url, fields: { title: 'Siege' } });

    expect(result).toStrictEqual({ url, status: 201, body: '{"id":"g1","title":"Siege"}' });
  });
});
