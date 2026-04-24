import { roleToModelStatics } from '../../statics/role-to-model/role-to-model-statics';
import { roleToModelTransformer } from './role-to-model-transformer';

type ClaudeSpawnRole = keyof typeof roleToModelStatics;

const CLAUDE_SPAWN_ROLES = Object.keys(roleToModelStatics) as readonly ClaudeSpawnRole[];

describe('roleToModelTransformer', () => {
  it.each(CLAUDE_SPAWN_ROLES)('VALID: {role: %s} => returns mapped model from statics', (role) => {
    expect(roleToModelTransformer({ role })).toBe(roleToModelStatics[role]);
  });
});
