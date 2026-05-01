/**
 * PURPOSE: Stub factory for BinEntry contract
 *
 * USAGE:
 * const entry = BinEntryStub({ binName: 'dungeonmaster-pre-edit-lint' });
 * // Returns branded BinEntry with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { ContentTextStub } from '../content-text/content-text.stub';
import { binEntryContract, type BinEntry } from './bin-entry-contract';

export const BinEntryStub = ({ ...props }: StubArgument<BinEntry> = {}): BinEntry =>
  binEntryContract.parse({
    binName: ContentTextStub({ value: 'dungeonmaster-pre-edit-lint' }),
    binPath: ContentTextStub({ value: './dist/src/startup/start-pre-edit-hook.js' }),
    ...props,
  });
