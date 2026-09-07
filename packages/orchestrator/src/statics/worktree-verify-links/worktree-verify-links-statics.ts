/**
 * PURPOSE: Bounds how much of a failed worktree link audit reaches the failure message. The
 * audit's own failure mode is all-or-nothing — a populate that wrote absolute targets wrote them
 * for every entry it touched — so an unbounded report would put hundreds of near-identical lines
 * into a work item's `errorMessage`, which the execution panel renders verbatim. The count is
 * always stated in full; the cap only limits how many are spelled out.
 *
 * USAGE:
 * worktreeVerifyLinksStatics.maxReportedLinks;
 * // Returns 10
 */

export const worktreeVerifyLinksStatics = {
  maxReportedLinks: 10,
} as const;
