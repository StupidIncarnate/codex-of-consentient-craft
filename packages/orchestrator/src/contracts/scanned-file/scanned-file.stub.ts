import type { StubArgument } from '@dungeonmaster/shared/@types';

import { scannedFileContract } from './scanned-file-contract';
import type { ScannedFile } from './scanned-file-contract';

export const ScannedFileStub = ({ ...props }: StubArgument<ScannedFile> = {}): ScannedFile =>
  scannedFileContract.parse({
    path: '/home/user/.claude/projects/-home-user-proj/session.jsonl',
    mtimeMs: 1_789_274_969_242,
    size: 4_096,
    ...props,
  });
