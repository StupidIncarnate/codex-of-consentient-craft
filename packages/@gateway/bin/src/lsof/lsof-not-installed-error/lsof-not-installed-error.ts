/**
 * PURPOSE: Names "lsof is not on this machine" for a caller of `#gateway/bin/lsof`, re-thrown by
 * `listeningPids` whenever `#gateway/node/child_process`'s `run` reports its own
 * `RunNotFoundError`. `lsof`'s own "nothing is listening on this port" result and a missing binary
 * both start from `run` failing to produce a normal exit, but `run` itself tells them apart — a real
 * exit (even an empty one) resolves, only a process that never started throws — so this class exists
 * purely for that thrown case, never for an empty listener list.
 *
 * USAGE:
 * throw new LsofNotInstalledError('lsof -ti :3737 could not start: ...');
 */

export class LsofNotInstalledError extends Error {}
