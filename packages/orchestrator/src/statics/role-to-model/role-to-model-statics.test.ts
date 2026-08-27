import { agentPromptClassificationStatics } from '../agent-prompt-classification/agent-prompt-classification-statics';
import { roleToModelStatics } from './role-to-model-statics';

// The five operation-owning roles, read from the list that defines them rather than retyped — a
// sixth operator role added there is one this test covers the day it lands.
const OPERATOR_ROLES = agentPromptClassificationStatics.operatorRoleNames;

describe('roleToModelStatics', () => {
  it('VALID: exports exact role→model mapping', () => {
    expect(roleToModelStatics).toStrictEqual({
      chaoswhisperer: 'opus',
      glyphsmith: 'opus',
      bughunt: 'opus',
      tavernkeeper: 'opus',
      flowrider: 'sonnet',
      groundstomper: 'sonnet',
      siegemaster: 'sonnet',
      codeweaver: 'sonnet',
      spiritmender: 'sonnet',
      pesteater: 'sonnet',
      warpgate: 'opus',
    });
  });

  // An operator opens no source file, writes nothing and renders no verdict — it dispatches, reads
  // a plan back, runs two gates and routes. The expensive reasoning moved DOWN to the minions,
  // where the models are fixed per minion instead (planner and reviewer opus, worker sonnet).
  // Asserted as a property of the whole operator SET so a role cannot quietly drift back up.
  it('VALID: {the five operator roles} => every one runs on sonnet', () => {
    expect(OPERATOR_ROLES.map((role) => [role, roleToModelStatics[role]])).toStrictEqual([
      ['codeweaver', 'sonnet'],
      ['pesteater', 'sonnet'],
      ['flowrider', 'sonnet'],
      ['groundstomper', 'sonnet'],
      ['siegemaster', 'sonnet'],
    ]);
  });

  // The four CHAT roles are live conversations with the user where the spec produced IS the
  // deliverable, and warpgate resolves merge conflicts with no plan and no minions under it.
  it('VALID: {the conversational roles and warpgate} => stay on opus', () => {
    expect({
      chaoswhisperer: roleToModelStatics.chaoswhisperer,
      glyphsmith: roleToModelStatics.glyphsmith,
      bughunt: roleToModelStatics.bughunt,
      tavernkeeper: roleToModelStatics.tavernkeeper,
      warpgate: roleToModelStatics.warpgate,
    }).toStrictEqual({
      chaoswhisperer: 'opus',
      glyphsmith: 'opus',
      bughunt: 'opus',
      tavernkeeper: 'opus',
      warpgate: 'opus',
    });
  });
});
