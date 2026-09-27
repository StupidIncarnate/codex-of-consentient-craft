/**
 * PURPOSE: A real `Minimatch` instance, built through the real constructor — for a caller staging
 * this subpath's own value instead of hand-typing a fake matcher.
 *
 * USAGE:
 * const matcher = MinimatchInstanceStub();
 * // Returns a real Minimatch for the '*.ts' pattern
 */
import { Minimatch } from 'minimatch';

export const MinimatchInstanceStub = ({ pattern = '*.ts' }: { pattern?: string } = {}): Minimatch =>
  new Minimatch(pattern);
