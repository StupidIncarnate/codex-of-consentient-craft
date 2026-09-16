import { recipeDeclareBroker } from './recipe-declare-broker';
import { recipeDeclareBrokerProxy } from './recipe-declare-broker.proxy';
import { OpRemoveStub } from '../../../contracts/op-remove/op-remove.stub';
import { OpSetStub } from '../../../contracts/op-set/op-set.stub';
import { questFieldsContract } from '../../../../test/type-fixtures/dm-target';

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
