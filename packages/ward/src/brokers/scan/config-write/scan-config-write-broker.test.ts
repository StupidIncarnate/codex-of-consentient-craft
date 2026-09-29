import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ScanRuleNameStub } from '../../../contracts/scan-rule-name/scan-rule-name.stub';
import { scanConfigWriteBroker } from './scan-config-write-broker';
import { scanConfigWriteBrokerProxy } from './scan-config-write-broker.proxy';

describe('scanConfigWriteBroker', () => {
  it('VALID: {rule, root} => writes the wrapper for that rule and root into a temp dir and returns both paths', () => {
    const proxy = scanConfigWriteBrokerProxy();
    proxy.setupTempDir({ directory: '/tmp/ward-scan-x1y2z3' });

    const result = scanConfigWriteBroker({
      rule: ScanRuleNameStub({ value: 'no-console' }),
      rootPath: AbsoluteFilePathStub({ value: '/repo' }),
    });

    const source = String(proxy.getWrittenSource({ directory: '/tmp/ward-scan-x1y2z3' }));

    expect({ result, head: source.split('\n').slice(0, 3) }).toStrictEqual({
      result: {
        directory: '/tmp/ward-scan-x1y2z3',
        path: '/tmp/ward-scan-x1y2z3/eslint.scan.config.cjs',
      },
      head: [
        'const base = require("/repo/eslint.config.js");',
        'const configs = Array.isArray(base) ? base : base.default;',
        'const rule = "no-console";',
      ],
    });
  });
});
