/**
 * PURPOSE: Message the pre-folder-detail hook feeds back when it blocks a `Write` into a folder
 * type the caller never loaded with `get-folder-detail` this session. Reach for this over
 * `violationMessageStatics` (a lint-violation report) and `worktreeBlockMessageStatics` (a
 * different tool's refusal) — this one names the exact `modifyingCodeGuidance` rule the caller
 * skipped, quoted verbatim so the two never drift apart.
 *
 * USAGE:
 * folderDetailBlockMessageStatics.header;
 * // Returns: the block header line shown before the quoted rule and the re-submit footer
 */

export const folderDetailBlockMessageStatics = {
  header: '🛑 get-folder-detail has not been called for this folder type this session.',
  rule: 'Call it before your first write into a folder type you have not already loaded this session, so a pass adding a broker and a contract makes two calls, not one.',
  footer:
    'Your write was NOT applied — the file is unchanged. Make the call, then re-submit the ENTIRE write.',
} as const;
