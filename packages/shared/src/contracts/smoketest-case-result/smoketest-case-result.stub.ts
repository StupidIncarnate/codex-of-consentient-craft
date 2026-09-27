import type { StubArgument } from '../../@types/stub-argument.type';

import { smoketestCaseResultContract } from './smoketest-case-result-contract';
import type { SmoketestCaseResult } from './smoketest-case-result-contract';

export const SmoketestCaseResultStub = ({
  ...props
}: StubArgument<SmoketestCaseResult> = {}): SmoketestCaseResult =>
  smoketestCaseResultContract.parse({
    caseId: 'mcp-list-quests',
    name: 'MCP: list-quests',
    passed: true,
    ...props,
  });
