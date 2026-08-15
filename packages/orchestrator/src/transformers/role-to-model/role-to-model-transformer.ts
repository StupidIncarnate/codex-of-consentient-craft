/**
 * PURPOSE: Resolves a Claude-spawning work-item role to its Claude CLI model
 *
 * USAGE:
 * roleToModelTransformer({ role: workItemRoleContract.parse('codeweaver') });
 * // Returns 'opus' as ClaudeModel
 */

import type { WorkItemRole } from '@dungeonmaster/shared/contracts';
import type { workItemRoleStatics } from '@dungeonmaster/shared/statics';

import type { ClaudeModel } from '../../contracts/claude-model/claude-model-contract';
import { roleToModelStatics } from '../../statics/role-to-model/role-to-model-statics';

// Derived from the command-role tuple rather than named here: a literal `Exclude<…, 'ward'>` leaves
// every later command role inside ClaudeSpawnRole, which then requires `roleToModelStatics` to carry
// a model for a role that spawns no Claude at all. Deriving it makes adding a command role a
// one-line edit in `workItemRoleStatics` instead of a type error here.
type CommandWorkItemRole = typeof workItemRoleStatics.command extends readonly (infer Role)[]
  ? Role
  : never;

type ClaudeSpawnRole = Exclude<WorkItemRole, CommandWorkItemRole>;

// `satisfies` keeps the completeness guarantee — a role added to the enum but not to the command
// tuple and not given a model fails the build here. The DECLARED type widens the index instead, so
// a command role can be looked up and refused below rather than every caller having to prove
// statically that it holds a spawn role: guards in this codebase take a destructured object, so
// none of them can be a type predicate and none of them narrows `workItem.role`.
const mapping: Readonly<Partial<Record<WorkItemRole, ClaudeModel>>> =
  roleToModelStatics satisfies Record<ClaudeSpawnRole, ClaudeModel>;

export const roleToModelTransformer = ({ role }: { role: WorkItemRole }): ClaudeModel => {
  const model = mapping[role];

  // Unreachable for a Claude-spawning role: the `satisfies` above proves every one of them is a key
  // here, so an absent entry means the caller handed over a COMMAND role.
  if (model === undefined) {
    throw new Error(
      `roleToModelTransformer: '${role}' is a command role — the dispatcher runs it itself, so it spawns no Claude session and has no model`,
    );
  }

  return model;
};
