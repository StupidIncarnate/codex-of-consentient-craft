import { SmoketestRunIdStub } from '@dungeonmaster/shared/contracts/smoketest-run-id/smoketest-run-id.stub';
import { SmoketestSuiteStub } from '@dungeonmaster/shared/contracts/smoketest-suite/smoketest-suite.stub';

import { IsoTimestampStub } from '../iso-timestamp/iso-timestamp.stub';
import { activeSmoketestRunContract } from './active-smoketest-run-contract';
import { ActiveSmoketestRunStub } from './active-smoketest-run.stub';

describe('activeSmoketestRunContract', () => {
  it('VALID: {runId, suite, startedAt} => parses successfully', () => {
    const runId = SmoketestRunIdStub();
    const suite = SmoketestSuiteStub({ value: 'mcp' });
    const startedAt = IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' });

    const result = activeSmoketestRunContract.parse(
      ActiveSmoketestRunStub({ runId, suite, startedAt }),
    );

    expect(result).toStrictEqual({ runId, suite, startedAt });
  });
});
