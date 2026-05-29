import { ReconcileWatchersLayerResponder } from './reconcile-watchers-layer-responder';
import { ReconcileWatchersLayerResponderProxy } from './reconcile-watchers-layer-responder.proxy';

describe('ReconcileWatchersLayerResponder', () => {
  it('VALID: {no guilds} => returns 0/0 counts and leaves watchers untouched', async () => {
    ReconcileWatchersLayerResponderProxy();

    const result = await ReconcileWatchersLayerResponder({
      watchers: new Map(),
      projectDir: '/repo',
    });

    expect(result).toStrictEqual({ started: 0, stopped: 0 });
  });
});
