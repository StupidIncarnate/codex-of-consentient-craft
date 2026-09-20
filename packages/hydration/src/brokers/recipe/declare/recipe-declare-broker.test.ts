import { recipeDeclareBroker } from './recipe-declare-broker';
import { recipeDeclareBrokerProxy } from './recipe-declare-broker.proxy';
import { OpRemoveStub } from '../../../contracts/op-remove/op-remove.stub';
import { OpSetStub } from '../../../contracts/op-set/op-set.stub';
import {
  questFieldsContract,
  guildIngredient,
  questIngredient,
} from '../../../../test/type-fixtures/dm-target';
import { entryChainTransformer } from '../../../transformers/entry-chain/entry-chain-transformer';
import type { HydrationOpStub } from '../../../contracts/hydration-op/hydration-op.stub';

type HydrationOp = ReturnType<typeof HydrationOpStub>;

describe('recipeDeclareBroker', () => {
  it('VALID: {name, description, build returning two ops} => calling it returns {recipeName, ops}', () => {
    recipeDeclareBrokerProxy();

    const guildMidExecution = recipeDeclareBroker({
      name: 'guild-mid-execution',
      description: 'one guild holding three quests, the first running',
      build: () =>
        [OpRemoveStub({ ref: 'quest[0:1]' }), OpRemoveStub({ ref: 'guild[0:0]' })] as never,
    });
    const plan = guildMidExecution();

    expect(plan).toStrictEqual({
      recipeName: 'guild-mid-execution',
      ops: [
        { op: 'remove', ref: 'quest[0:1]' },
        { op: 'remove', ref: 'guild[0:0]' },
      ],
    });
  });

  it('VALID: {the returned function} => carries recipeName and description as properties', () => {
    recipeDeclareBrokerProxy();

    const guildMidExecution = recipeDeclareBroker({
      name: 'guild-mid-execution',
      description: 'one guild holding three quests, the first running',
      build: () => [],
    });

    expect({
      recipeName: guildMidExecution.recipeName,
      description: guildMidExecution.description,
    }).toStrictEqual({
      recipeName: 'guild-mid-execution',
      description: 'one guild holding three quests, the first running',
    });
  });

  it('VALID: {called twice} => returns two structurally identical plans', () => {
    recipeDeclareBrokerProxy();

    const guildMidExecution = recipeDeclareBroker({
      name: 'guild-mid-execution',
      description: 'one guild holding three quests, the first running',
      build: () => [OpRemoveStub({ ref: 'quest[0:1]' })] as never,
    });

    const firstPlan = guildMidExecution();
    const secondPlan = guildMidExecution();

    expect(firstPlan).toStrictEqual(secondPlan);
  });

  it('VALID: {a real recipe over a real registry, called twice in one process} => both calls mint the identical top-level reference', () => {
    recipeDeclareBrokerProxy();

    const dm = entryChainTransformer({
      registry: { guilds: guildIngredient, quests: questIngredient },
    });
    const guildMidExecution = recipeDeclareBroker({
      name: 'guild-mid-execution',
      description: 'one guild holding three quests, the first running',
      build: () => [dm.guilds.add(1, (g) => [g[0].saveRecordAs({ name: 'guild' })])],
    });

    const firstPlan = guildMidExecution();
    const secondPlan = guildMidExecution();

    expect([firstPlan.ops[0], secondPlan.ops[0]] as unknown as HydrationOp[]).toStrictEqual([
      { op: 'create', ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [], fields: {} },
      { op: 'create', ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [], fields: {} },
    ]);
  });

  it('VALID: {a builder taking {guildId}} => the ops carry the supplied guildId', () => {
    recipeDeclareBrokerProxy();

    const sessionWithNestedChain = recipeDeclareBroker({
      name: 'session-with-nested-chain',
      description: 'one session under an existing guild, holding a nested sub-agent chain',
      inputs: questFieldsContract.pick({ guildId: true }),
      build: ({ guildId }) => [OpSetStub({ ref: 'session[0:0]', written: { guildId } })] as never,
    });

    const plan = sessionWithNestedChain({
      guildId: questFieldsContract.shape.guildId.parse('guild-1'),
    });

    expect(plan).toStrictEqual({
      recipeName: 'session-with-nested-chain',
      ops: [{ op: 'set', ref: 'session[0:0]', written: { guildId: 'guild-1' } }],
    });
  });
});
