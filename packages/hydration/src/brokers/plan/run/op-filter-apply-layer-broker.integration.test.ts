import { opFilterApplyLayerBroker } from './op-filter-apply-layer-broker';
import { apiTargetHarness } from '../../../../test/harnesses/api-target/api-target.harness';
import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { OpFilterStub } from '../../../contracts/op-filter/op-filter.stub';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { HydrationTargetStub } from '../../../contracts/hydration-target/hydration-target.stub';
import { HydrationRunStateStub } from '../../../contracts/hydration-run-state/hydration-run-state.stub';
import { HydrationQueryFailedError } from '../../../errors/hydration-query-failed/hydration-query-failed-error';

// A real socket, not an injected `query` that fabricates a rejection string.
// `op-filter-apply-layer-broker.test.ts` beside this one proves the runner tells "the app is
// unreachable" apart from "the query resolved zero rows" given a SUPPLIED shape of failure; this
// suite proves the OS really refuses the query's own connection — sad-path row 7's other half.
describe('opFilterApplyLayerBroker (integration — real sockets)', () => {
  const harness = apiTargetHarness();

  it('ERROR: {the query route hits a real refused connection} => throws HydrationQueryFailedError naming the real ECONNREFUSED cause', async () => {
    const refusedUrl = harness.refusedUrl({ path: '/api/operations' });
    const escapedUrl = refusedUrl.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const config = IngredientConfigStub({
      name: 'operation',
      routes: {
        write: (): unknown => undefined,
        query: async (): Promise<unknown> => fetchPostAdapter({ url: refusedUrl, fields: {} }),
      },
    });
    const op = OpFilterStub({
      ingredient: 'operation',
      where: { role: 'riftcarver' },
      expect: 'some',
      ops: [],
    });
    const state = HydrationRunStateStub({});

    await expect(
      opFilterApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
    ).rejects.toThrow(HydrationQueryFailedError);

    await expect(
      opFilterApplyLayerBroker({ op, target: HydrationTargetStub({}), config, state }),
    ).rejects.toThrow(
      new RegExp(
        `^recipe "guild-mid-execution": ingredient "operation" filter where \\{"role":"riftcarver"\\} could not query: Error: POST ${escapedUrl} refused: connect ECONNREFUSED 127\\.0\\.0\\.1:\\d+$`,
        'u',
      ),
    );
  });
});
