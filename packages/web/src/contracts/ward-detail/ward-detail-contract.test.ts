import { wardDetailContract } from './ward-detail-contract';
import { WardDetailStub } from './ward-detail.stub';

describe('wardDetailContract', () => {
  describe('valid input', () => {
    it('VALID: {checks with one lint error} => parses and exposes filePath/message/line/rule', () => {
      const detail = WardDetailStub();

      const result = wardDetailContract.parse(detail);
      const check = result.checks?.[0];
      const error = check?.projectResults?.[0]?.errors?.[0];

      expect({
        checkType: check?.checkType,
        filePath: error?.filePath,
        message: error?.message,
        line: error?.line,
        rule: error?.rule,
      }).toStrictEqual({
        checkType: 'lint',
        filePath: 'packages/web/src/index.ts',
        message: 'Unexpected any',
        line: 10,
        rule: '@typescript-eslint/no-explicit-any',
      });
    });

    it('VALID: {test failure entry} => parses suitePath/testName/message', () => {
      const detail = wardDetailContract.parse({
        checks: [
          {
            checkType: 'unit',
            projectResults: [
              {
                testFailures: [
                  {
                    suitePath: 'src/foo.test.ts',
                    testName: 'does a thing',
                    message: 'expected true',
                  },
                ],
              },
            ],
          },
        ],
      });

      const failure = detail.checks?.[0]?.projectResults?.[0]?.testFailures?.[0];

      expect({
        suitePath: failure?.suitePath,
        testName: failure?.testName,
        message: failure?.message,
      }).toStrictEqual({
        suitePath: 'src/foo.test.ts',
        testName: 'does a thing',
        message: 'expected true',
      });
    });

    it('EMPTY: {empty object} => parses to checks undefined', () => {
      const result = wardDetailContract.parse({});

      expect(result.checks).toBe(undefined);
    });
  });
});
