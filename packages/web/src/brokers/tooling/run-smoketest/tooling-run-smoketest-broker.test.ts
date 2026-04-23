import {
  SmoketestCaseResultStub,
  SmoketestRunIdStub,
  SmoketestSuiteStub,
} from '@dungeonmaster/shared/contracts';

import { toolingRunSmoketestBroker } from './tooling-run-smoketest-broker';
import { toolingRunSmoketestBrokerProxy } from './tooling-run-smoketest-broker.proxy';

describe('toolingRunSmoketestBroker', () => {
  it('VALID: {suite: mcp} => returns the runId and results from the server', async () => {
    const runId = SmoketestRunIdStub();
    const results = [SmoketestCaseResultStub()];
    const proxy = toolingRunSmoketestBrokerProxy();
    proxy.setupSuccess({ runId, results });

    const result = await toolingRunSmoketestBroker({
      suite: SmoketestSuiteStub({ value: 'mcp' }),
    });

    expect(result).toStrictEqual({ runId, results });
  });
});
