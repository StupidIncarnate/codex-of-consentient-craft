import { SmoketestSuiteStub } from '@dungeonmaster/shared/contracts/smoketest-suite/smoketest-suite.stub';

import { activeSmoketestRunContract } from './active-smoketest-run-contract';
import { ActiveSmoketestRunStub } from './active-smoketest-run.stub';

describe('activeSmoketestRunContract', () => {
  it('VALID: {runId, suite, startedAt} => parses successfully', () => {
    const runId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const suite = SmoketestSuiteStub({ value: 'mcp' });
    const startedAt = '2024-01-15T10:00:00.000Z';

    const result = activeSmoketestRunContract.parse(
      ActiveSmoketestRunStub({ runId, suite, startedAt }),
    );

    expect(result).toStrictEqual({ runId, suite, startedAt });
  });
});
