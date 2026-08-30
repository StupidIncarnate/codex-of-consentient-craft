import { agentPromptClassificationStatics } from '../agent-prompt-classification/agent-prompt-classification-statics';
import { roleToModelStatics } from './role-to-model-statics';

// The operation-owning roles, read from the list that defines them rather than retyped — a fourth
// operator role added there is one this test covers the day it lands.
const OPERATOR_ROLES = agentPromptClassificationStatics.operatorRoleNames;

describe('roleToModelStatics', () => {
  it('VALID: exports exact role→model mapping', () => {
    expect(roleToModelStatics).toStrictEqual({
      chaoswhisperer: 'opus',
      glyphsmith: 'opus',
      bughunt: 'opus',
      tavernkeeper: 'opus',
      flowrider: 'opus',
      siegemaster: 'opus',
      codeweaver: 'opus',
      spiritmender: 'sonnet',
      warpgate: 'opus',
    });
  });

  // An operator reads code: it plans what it hands out, judges what comes back against the files it
  // opened, and decides whether its scope is done. Asserted as a property of the whole operator SET
  // so a role cannot quietly drift back down.
  it('VALID: {the operator roles} => every one runs on opus', () => {
    expect(OPERATOR_ROLES.map((role) => [role, roleToModelStatics[role]])).toStrictEqual([
      ['codeweaver', 'opus'],
      ['flowrider', 'opus'],
      ['siegemaster', 'opus'],
    ]);
  });

  // The four CHAT roles are live conversations with the user where the spec produced IS the
  // deliverable, and warpgate resolves merge conflicts with no plan under it.
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

  // Spiritmender repairs against a ward blob that names the failures for it, which is the one
  // dispatched role whose reasoning is bounded by its input.
  it('VALID: {spiritmender} => runs on sonnet', () => {
    expect(roleToModelStatics.spiritmender).toBe('sonnet');
  });
});
