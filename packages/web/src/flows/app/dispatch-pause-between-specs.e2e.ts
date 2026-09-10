import { test, expect } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';

const GUILD_PATH = '/tmp/dm-e2e-dispatch-pause-between-specs';
const DISPATCH_PLAY_ROUTE = '/api/orchestration/dispatch/play';
const HTTP_OK = 200;

// The dispatcher is ONE in-memory singleton for the whole run — `workers: 1` and
// `fullyParallel: false`, every spec against one long-lived server — and two ordinary user actions
// start it: `QuestStartResponder` and `QuestResumeResponder` both play it, so clicking Begin Quest
// or RESUME leaves a loop running after the spec that clicked it ends. That loop then eats the next
// spec's queued mock responses and drives its fixtures.
//
// Pausing used to be opt-in, on a harness the spec that started the loop need never have imported.
// The `e2e-fixtures` auto-fixture pauses for every test instead, and THIS FILE is what proves it:
// the first test stages the leak deliberately and cleans up after nothing, and the second measures
// the state it inherits. Delete the fixture and the second test goes red naming `node-playing`.
//
// The order is load-bearing and is what the config already guarantees: one worker, no parallelism,
// tests within a file run in declaration order.
test.describe('The dispatcher never leaks a playing loop into the next spec', () => {
  test('VALID: {a spec plays the dispatcher and pauses nothing itself} => it ends with the loop running', async ({
    request,
  }) => {
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });

    // No guild means no active quest for the woken loop to scan, so it idles instead of carving a
    // real worktree against whatever a previous spec left behind.
    await guildHarness({ request }).cleanGuilds();

    // `force: true` skips the play gate, the same override `dispatchHarness.playAndDrive` uses, so
    // a stale MCP heartbeat from an earlier spec cannot refuse this and make the leak vanish.
    const playResponse = await request.post(DISPATCH_PLAY_ROUTE, { data: { force: true } });

    expect(playResponse.status()).toBe(HTTP_OK);
    // Read back from the server rather than trusted from the response body: the leak this file
    // stages is the SERVER's mode, and that is the only place it is real.
    expect(await dispatch.isDispatchPlaying()).toBe(true);
  });

  test('VALID: {the spec before this one left the dispatcher playing} => this spec still begins paused', async ({
    request,
  }) => {
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });

    // The first thing this spec does, before it touches a guild, a quest or a page — because
    // "begins paused" is a claim about the state it INHERITED, and any setup of its own would give
    // the loop time to move.
    expect(await dispatch.isDispatchPlaying()).toBe(false);
  });
});
