import type { StubArgument } from '@dungeonmaster/shared/@types';

import { UsageBucketStub } from '../usage-bucket/usage-bucket.stub';
import { usageLedgerContract } from './usage-ledger-contract';
import type { UsageLedger } from './usage-ledger-contract';

export const UsageLedgerStub = ({ ...props }: StubArgument<UsageLedger> = {}): UsageLedger =>
  usageLedgerContract.parse({
    buckets: { '1789272000000': UsageBucketStub() },
    cursors: {
      '/home/user/.claude/projects/-home-user-proj/session.jsonl': {
        mtimeMs: 1_789_274_969_242,
        size: 4_096,
      },
    },
    ceilings: { fiveHour: null, sevenDay: 2_751_372_486 },
    updatedAt: '2026-09-13T04:49:29.242Z',
    ...props,
  });
