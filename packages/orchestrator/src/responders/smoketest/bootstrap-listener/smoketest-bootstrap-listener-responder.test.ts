import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { SmoketestListenerEntryStub } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry.stub';
import { SmoketestScenarioMetaStub } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta.stub';
import { SmoketestBootstrapListenerResponder } from './smoketest-bootstrap-listener-responder';
import { SmoketestBootstrapListenerResponderProxy } from './smoketest-bootstrap-listener-responder.proxy';
import { setImmediate } from '#gateway/node/setImmediate';

const tick = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('SmoketestBootstrapListenerResponder', () => {
  // Both calls happen in the SAME test, back to back with no await between them: `state.installed`
  // inside the responder module has no reset hook once a real install lands, so a second `it` block
  // can never exercise "called again before install settles" honestly. Calling it twice here proves
  // BOTH the real wiring (an outbox line reaches processTerminalEventLayerBroker for the registered
  // listener) AND idempotence (a second, concurrent call installs no second listener — only ONE
  // dispatch happens) in one self-contained test.
  it('VALID: {called twice before install settles, then a terminal quest event} => installs once and dispatches the post-terminal handler', async () => {
    const proxy = SmoketestBootstrapListenerResponderProxy();
    proxy.reset();
    proxy.setupProcessSucceeds();
    const questId = QuestIdStub({ value: 'q-smoketest-bootstrap' });
    const entry = SmoketestListenerEntryStub();
    const scenarioMeta = SmoketestScenarioMetaStub();
    proxy.registerListener({ questId, entry, scenarioMeta });
    // Staged before the install: the tail drains the outbox once as it starts, consuming this batch.
    proxy.setupLines({
      lines: [JSON.stringify({ questId, timestamp: '2026-09-13T05:00:00.000Z' })],
    });

    SmoketestBootstrapListenerResponder();
    SmoketestBootstrapListenerResponder();
    await tick(); // dungeonmasterHomeEnsureBroker + fs.append resolve; the tail is now started
    await tick();
    await tick();
    await tick();
    await tick();
    await tick(); // the readline 'line'/'close' events and the dispatched handler settle

    // Exactly one dispatch, for the one staged line — a second install would have wired a second
    // listener onto the same outbox mock and doubled this.
    expect(proxy.getProcessCallArgs()).toStrictEqual([
      [
        {
          questId,
          entry,
          scenarioMeta,
          unregisterListener: expect.any(Function),
        },
      ],
    ]);
  });
});
