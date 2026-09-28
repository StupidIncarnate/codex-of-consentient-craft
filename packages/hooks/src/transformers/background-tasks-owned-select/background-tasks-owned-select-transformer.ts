/**
 * PURPOSE: Narrows a stop event's `background_tasks` to the entries the STOPPING agent started
 * itself, by asking whether that agent's own transcript carries the harness's OWN marker for that
 * id, not merely the id text somewhere in the transcript. Reach for this before
 * `hasRunningBackgroundTaskGuard` on any event that can carry somebody else's work: the array is
 * SESSION-wide and carries no owner field, so a sibling's lane, a parent's dev server and a
 * grandparent's watcher all arrive in it looking exactly like the agent's own command.
 *
 * A bare `transcript.includes(id)` over-matches: an agent investigating a stale block by running
 * `ps -ef`, or reading a task's `tasks/<id>.output` path, reads a SIBLING's id into its OWN
 * transcript as a mention, not a start, and the next stop event blocks it on a command it never
 * ran. The harness marks an actual start two ways — `Command running in background with ID: <id>`
 * and `… was moved to the background (ID: <id>)` for a shell, `"agentId":"<id>"` on every line of
 * the agent's own subagent entry — and both share a literal prefix immediately before the id, which
 * is what this anchors on instead.
 *
 * USAGE:
 * backgroundTasksOwnedSelectTransformer({ backgroundTasks, transcript });
 * // Returns: the subset of entries this transcript started
 */

import { regexEscapeTransformer } from '../regex-escape/regex-escape-transformer';
import type { HookBackgroundTask } from '../../contracts/hook-background-task/hook-background-task-contract';

export const backgroundTasksOwnedSelectTransformer = ({
  backgroundTasks,
  transcript,
}: {
  backgroundTasks: HookBackgroundTask[];
  transcript: string;
}): HookBackgroundTask[] =>
  backgroundTasks.filter((task) => {
    const escapedId = regexEscapeTransformer({ str: String(task.id) }).toString();
    return new RegExp(`(?:ID:\\s*|"agentId":")${escapedId}\\b`, 'u').test(transcript);
  });
