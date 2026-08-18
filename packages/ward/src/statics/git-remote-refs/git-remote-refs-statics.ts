/**
 * PURPOSE: Names the git refs and ref aliases that stand for "what the remote already has", so the
 * upstream-detection and unpushed-diff brokers spell them identically.
 *
 * USAGE:
 * gitRemoteRefsStatics.upstreamAlias;
 * // '@{upstream}'
 */

export const gitRemoteRefsStatics = {
  upstreamAlias: '@{upstream}',
  originMain: 'origin/main',
  originMaster: 'origin/master',
} as const;
