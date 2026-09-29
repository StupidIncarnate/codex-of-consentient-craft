import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';

import { ScanRuleNameStub } from '../../contracts/scan-rule-name/scan-rule-name.stub';
import { scanEslintConfigSourceTransformer } from './scan-eslint-config-source-transformer';

describe('scanEslintConfigSourceTransformer', () => {
  it('VALID: {plugin rule, root config path} => returns the wrapper source naming both, severity error, one entry per registering config object', () => {
    const result = scanEslintConfigSourceTransformer({
      rule: ScanRuleNameStub({ value: '@dungeonmaster/ban-primitives' }),
      rootConfigPath: AbsoluteFilePathStub({ value: '/repo/eslint.config.js' }),
    });

    expect(result).toBe(`const base = require("/repo/eslint.config.js");
const configs = Array.isArray(base) ? base : base.default;
const rule = "@dungeonmaster/ban-primitives";
const forced = { [rule]: "error" };
const slash = rule.lastIndexOf('/');
const pluginName = slash === -1 ? null : rule.slice(0, slash);
const registering = pluginName === null ? [] : configs.filter((entry) => entry && entry.plugins && Object.prototype.hasOwnProperty.call(entry.plugins, pluginName));
if (pluginName !== null && registering.length === 0) {
  throw new Error('No config object in ' + "/repo/eslint.config.js" + ' registers plugin "' + pluginName + '" for rule "' + rule + '"');
}
const forcing = pluginName === null
  ? [{ rules: forced }]
  : registering.map((entry) => ({
      ...(entry.files ? { files: entry.files } : {}),
      ...(entry.ignores ? { ignores: entry.ignores } : {}),
      rules: forced,
    }));
module.exports = [...configs, ...forcing];
`);
  });

  it('VALID: {core rule} => returns source with the rule name embedded as a JSON string literal', () => {
    const result = scanEslintConfigSourceTransformer({
      rule: ScanRuleNameStub({ value: 'no-console' }),
      rootConfigPath: AbsoluteFilePathStub({ value: '/repo/eslint.config.js' }),
    });

    expect(result.split('\n')[2]).toBe('const rule = "no-console";');
  });
});
