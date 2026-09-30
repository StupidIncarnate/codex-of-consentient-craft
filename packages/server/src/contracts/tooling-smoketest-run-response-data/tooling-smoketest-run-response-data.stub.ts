import type { StubArgument } from '@dungeonmaster/shared/@types';
import { SmoketestCaseResultStub } from '@dungeonmaster/shared/contracts/smoketest-case-result/smoketest-case-result.stub';
import { toolingSmoketestRunResponseDataContract } from './tooling-smoketest-run-response-data-contract';
import type { ToolingSmoketestRunResponseData } from './tooling-smoketest-run-response-data-contract';

export const ToolingSmoketestRunResponseDataStub = ({
  ...props
}: StubArgument<ToolingSmoketestRunResponseData> = {}): ToolingSmoketestRunResponseData =>
  toolingSmoketestRunResponseDataContract.parse({
    runId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    enqueued: [{ questId: 'add-auth', guildSlug: 'my-guild' }],
    results: [SmoketestCaseResultStub()],
    ...props,
  });
