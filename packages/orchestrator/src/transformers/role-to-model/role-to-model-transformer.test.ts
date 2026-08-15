import { workItemRoleStatics } from '@dungeonmaster/shared/statics';

import { roleToModelStatics } from '../../statics/role-to-model/role-to-model-statics';
import { roleToModelTransformer } from './role-to-model-transformer';

type ClaudeSpawnRole = keyof typeof roleToModelStatics;

const CLAUDE_SPAWN_ROLES = Object.keys(roleToModelStatics) as readonly ClaudeSpawnRole[];

// "Every spawn role carries a model" is proven at COMPILE time by the `satisfies` in the
// implementation, so it gets no runtime case here — a test that can never fail is noise.
describe('roleToModelTransformer', () => {
  it.each(CLAUDE_SPAWN_ROLES)('VALID: {role: %s} => returns mapped model from statics', (role) => {
    expect(roleToModelTransformer({ role })).toBe(roleToModelStatics[role]);
  });

  // Derived from the command tuple, not a hardcoded list: the refusal exists so a command role can
  // never silently resolve to some other role's model, and a case list that had to be remembered
  // would miss exactly the role that regression describes.
  it.each(workItemRoleStatics.command)(
    'ERROR: {role: %s} => throws naming it a command role rather than resolving a model',
    (role) => {
      expect(() => roleToModelTransformer({ role })).toThrow(
        new RegExp(`'${role}' is a command role`, 'u'),
      );
    },
  );
});
