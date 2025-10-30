/**
 * PURPOSE: TypeScript interface for SessionStart hook event data
 *
 * USAGE:
 * const data: SessionStartHookData = { session_id: 'abc', transcript_path: '/path', cwd: '/cwd', hook_event_name: 'SessionStart' };
 * // Defines structure for SessionStart hook events
 */
/**
 * Data structure for SessionStart hook events.
 *
 * Contains information about a new session being started.
 */
export interface SessionStartHookData {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'SessionStart';
}
