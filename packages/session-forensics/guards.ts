/**
 * PURPOSE: The subpath a consumer imports this package's guards from, so nothing outside has to
 * reach into `src/`. Import from here rather than the root barrel when only the guards are wanted.
 *
 * USAGE:
 * import { isTrackOwedUnitGuard } from '@dungeonmaster/session-forensics/guards';
 */

// Does this reviewing role owe a verdict on this unit? Four of the six documented exclusions apply
export * from './src/guards/is-track-owed-unit/is-track-owed-unit-guard';

// A node the graph prints (terminal) that still points onward is not a terminal unit
export * from './src/guards/is-terminal-unit/is-terminal-unit-guard';
