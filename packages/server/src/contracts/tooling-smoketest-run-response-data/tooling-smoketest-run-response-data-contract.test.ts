import { toolingSmoketestRunResponseDataContract } from './tooling-smoketest-run-response-data-contract';
import { ToolingSmoketestRunResponseDataStub } from './tooling-smoketest-run-response-data.stub';
import { SmoketestCaseResultStub } from '@dungeonmaster/shared/contracts/smoketest-case-result/smoketest-case-result.stub';

describe('toolingSmoketestRunResponseDataContract', () => {
  it('VALID: {default stub} => parses the run id, enqueued quests and results', () => {
    const result = ToolingSmoketestRunResponseDataStub();

    expect(toolingSmoketestRunResponseDataContract.parse(result)).toStrictEqual({
      runId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      enqueued: [{ questId: 'add-auth', guildSlug: 'my-guild' }],
      results: [SmoketestCaseResultStub()],
    });
  });

  it('INVALID: {runId: run-123} => throws validation error', () => {
    expect(() =>
      toolingSmoketestRunResponseDataContract.parse({
        runId: 'run-123',
        enqueued: [],
        results: [],
      }),
    ).toThrow(/Invalid UUID/u);
  });
});
