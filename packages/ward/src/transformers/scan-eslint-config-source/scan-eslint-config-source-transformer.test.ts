import { scanEslintConfigSourceTransformer } from './scan-eslint-config-source-transformer';

describe('scanEslintConfigSourceTransformer', () => {
  it('VALID: {plugin rule, root config path} => returns the wrapper source naming both, raising a rule the repo turns on and forcing one it leaves off', () => {
    const result = scanEslintConfigSourceTransformer({
      rule: '@dungeonmaster/ban-primitives',
      rootConfigPath: '/repo/eslint.config.js',
    });

    expect(result).toBe(`const base = require("/repo/eslint.config.js");
const configs = Array.isArray(base) ? base : base.default;
const rule = "@dungeonmaster/ban-primitives";
const severity = "error";
const levelOf = (setting) => (Array.isArray(setting) ? setting[0] : setting);
const isOn = (entry) => Boolean(entry && entry.rules && entry.rules[rule] !== undefined && levelOf(entry.rules[rule]) !== 'off' && levelOf(entry.rules[rule]) !== 0);
const raise = (setting) => (Array.isArray(setting) ? [severity, ...setting.slice(1)] : severity);
const scopedByRepo = configs.some(isOn);
const slash = rule.lastIndexOf('/');
const pluginName = slash === -1 ? null : rule.slice(0, slash);
const registering = pluginName === null ? [] : configs.filter((entry) => entry && entry.plugins && Object.prototype.hasOwnProperty.call(entry.plugins, pluginName));
if (!scopedByRepo && pluginName !== null && registering.length === 0) {
  throw new Error('No config object in ' + "/repo/eslint.config.js" + ' registers plugin "' + pluginName + '" for rule "' + rule + '"');
}
const forcing = scopedByRepo
  ? []
  : pluginName === null
    ? [{ rules: { [rule]: severity } }]
    : registering.map((entry) => ({
        ...(entry.files ? { files: entry.files } : {}),
        ...(entry.ignores ? { ignores: entry.ignores } : {}),
        rules: { [rule]: severity },
      }));
const kept = configs.map((entry) => (isOn(entry) ? { ...entry, rules: { ...entry.rules, [rule]: raise(entry.rules[rule]) } } : entry));
module.exports = [...kept, ...forcing];
`);
  });

  it('VALID: {core rule} => returns source with the rule name embedded as a JSON string literal', () => {
    const result = scanEslintConfigSourceTransformer({
      rule: 'no-console',
      rootConfigPath: '/repo/eslint.config.js',
    });

    expect(result.split('\n')[2]).toBe('const rule = "no-console";');
  });
});
