// D12 — a recipe's params fail validation, driven against the REAL stepSeedBroker, the REAL
// recipesReadBroker/recipesLocateBroker, and the REAL built packages/siegelense-recipes package —
// no mocked proxy, unlike step-seed-broker.test.ts. No live browser or dev server needed: a
// LaneSession is a plain data value (home path + base url + nullable browser), and every case below
// is refused by the KEY check alone, before recipesLocateBroker's dynamic import ever runs — so a
// nonexistent home directory is fine, nothing writes.
import { stepSeedBroker } from '../../packages/siegelense/src/brokers/step/seed/step-seed-broker';
import { LaneSessionStub } from '../../packages/siegelense/src/contracts/lane-session/lane-session.stub';
import { StepStub } from '../../packages/siegelense/src/contracts/step/step.stub';
import { RecipeNameStub } from '../../packages/siegelense/src/contracts/recipe-name/recipe-name.stub';

const lane = LaneSessionStub({ browser: null, homePath: '/tmp/dm-d12-unused-home' });

const run = async ({ label, recipe, params }: { label: string; recipe: string; params?: Record<PropertyKey, unknown> }) => {
  console.log(`=== ${label} ===`);
  const step = StepStub({
    step: 'seed',
    recipe: RecipeNameStub({ value: recipe }),
    ...(params === undefined ? {} : { params }),
  });
  try {
    const reading = await stepSeedBroker({ lane, step });
    console.log('RESOLVED (unexpected):', reading);
  } catch (error) {
    console.log(
      'THREW:',
      error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error),
    );
  }
};

(async () => {
  await run({ label: 'D12a — unknown recipe name', recipe: 'not-a-real-recipe' });
  await run({ label: 'D12b — paramless recipe given a param it does not accept', recipe: 'guild-mid-execution', params: { x: 1 } });
  await run({ label: 'D12c — a recipe requiring guildPath, called with no params at all', recipe: 'session-with-nested-chain' });
  await run({ label: 'D12d — the same recipe, called with the wrong key', recipe: 'session-with-nested-chain', params: { wrongKey: 'x' } });
})();
