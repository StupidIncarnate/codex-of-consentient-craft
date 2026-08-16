import { agentPromptClassificationStatics } from '../agent-prompt-classification/agent-prompt-classification-statics';
import { roleToDisciplineStatics } from './role-to-discipline-statics';

// Mirrors packages/orchestrator/src/contracts/discipline/discipline-contract.ts — test files may
// not import contracts, so the discipline list is hardcoded here.
const DISCIPLINES = [
  'implementation',
  'bug-repro',
  'below-browser',
  'browser-e2e',
  'manual-qa',
] as const;

type RoleKey = keyof typeof roleToDisciplineStatics;
const ROLE_KEYS = Object.keys(roleToDisciplineStatics) as readonly RoleKey[];

const ROLE_NAMES_SET = new Set(agentPromptClassificationStatics.roleNames);
const DISCIPLINES_SET = new Set(DISCIPLINES);

describe('roleToDisciplineStatics', () => {
  it('VALID: exports exact role→discipline mapping', () => {
    expect(roleToDisciplineStatics).toStrictEqual({
      codeweaver: 'implementation',
      pesteater: 'bug-repro',
      flowrider: 'below-browser',
      groundstomper: 'browser-e2e',
      siegemaster: 'manual-qa',
    });
  });

  describe('drift guard', () => {
    it.each(ROLE_KEYS)(
      'VALID: {role: %s} => is a known agentPromptClassificationStatics.roleNames member',
      (role) => {
        expect(ROLE_NAMES_SET.has(role)).toBe(true);
      },
    );

    it.each(ROLE_KEYS)(
      'VALID: {role: %s} => maps to a value in the known discipline list',
      (role) => {
        expect(DISCIPLINES_SET.has(roleToDisciplineStatics[role])).toBe(true);
      },
    );
  });
});
