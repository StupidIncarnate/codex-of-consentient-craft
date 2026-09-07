/**
 * PURPOSE: The package's worktree surface — one entry, so that no caller outside this package ever
 * assembles a `git worktree add` of its own. Everything that wants an isolated tree (the MCP tool, a
 * riftcarver carve, a session that asks for one by name) goes through here and gets a tree with the
 * four properties a hand-rolled one silently lacks.
 *
 * USAGE:
 * const { worktreePath } = await WorktreeFlow.create({ name: 'probe' });
 * // '/repo/worktrees/probe'
 */

import { WorktreeCreateResponder } from '../../responders/worktree/create/worktree-create-responder';

type CreateParams = Parameters<typeof WorktreeCreateResponder>[0];
type CreateResult = Awaited<ReturnType<typeof WorktreeCreateResponder>>;

export const WorktreeFlow = {
  create: async ({ name }: CreateParams): Promise<CreateResult> =>
    WorktreeCreateResponder({ name }),
};
