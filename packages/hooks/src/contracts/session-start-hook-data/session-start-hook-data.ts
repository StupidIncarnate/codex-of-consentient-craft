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
