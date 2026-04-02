/**
 * PURPOSE: Creates test data for grep hits with line number and matched text
 *
 * USAGE:
 * const hit = GrepHitStub({ line: 14, text: 'if (error.code === "ENOENT") {' });
 * // Returns grep hit for content grep testing
 */
import { grepHitContract } from './grep-hit-contract';
import type { GrepHit } from './grep-hit-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const GrepHitStub = ({ ...props }: StubArgument<GrepHit> = {}): GrepHit =>
  grepHitContract.parse({ line: 1, text: 'matched line', ...props });
