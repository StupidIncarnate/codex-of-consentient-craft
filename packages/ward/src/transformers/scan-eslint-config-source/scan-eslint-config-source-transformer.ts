/**
 * PURPOSE: Writes the source of the wrapper ESLint config a scan runs under: the repo's own config,
 * with the one rule raised to `error` only where the repo means it to run. Reach for this rather
 * than ESLint's `--rule` flag, which builds one file-less config object and dies on every linted
 * file whose config never registered the rule's plugin.
 *
 * USAGE:
 * scanEslintConfigSourceTransformer({ rule: '@dungeonmaster/ban-workspace-export-mocks', rootConfigPath: '/repo/eslint.config.js' });
 * // Returns CommonJS source that exports the repo's config array with the rule raised to error
 *
 * The wrapper picks one of two modes when ESLint loads it:
 *
 * - SOME config object turns the rule on (any severity but `off`). The repo has scoped the rule, so
 *   the wrapper keeps every object and only raises each of those settings to `error`, keeping its
 *   options. A file the repo leaves the rule off for, by an `off` entry or by a block that never sets
 *   it, stays unscanned, exactly as the repo's own lint leaves it. A consumer whose gateway block
 *   never sets `enforce-project-structure` gets no hits in gateway source.
 * - NO config object turns it on. The rule is registered `off`, and the scan exists to measure it
 *   before it is switched on. A plugin rule gets one forcing entry per config object that registers
 *   its plugin, carrying that object's own `files` and `ignores`: only those files can resolve the
 *   rule, and an entry that reached further would throw on the rest. A core rule needs no plugin and
 *   gets one global entry. Severity alone keeps whatever options the repo config gave the rule. A
 *   plugin no config object registers makes the wrapper throw, so ESLint exits 2 and the scan fails,
 *   where a silent empty scan would read as a clean package.
 */

import { scanStatics } from '../../statics/scan/scan-statics';

export const scanEslintConfigSourceTransformer = ({
  rule,
  rootConfigPath,
}: {
  rule: string;
  rootConfigPath: string;
}): string =>
  [
    `const base = require(${JSON.stringify(rootConfigPath)});`,
    'const configs = Array.isArray(base) ? base : base.default;',
    `const rule = ${JSON.stringify(rule)};`,
    `const severity = ${JSON.stringify(scanStatics.eslint.severity)};`,
    'const levelOf = (setting) => (Array.isArray(setting) ? setting[0] : setting);',
    "const isOn = (entry) => Boolean(entry && entry.rules && entry.rules[rule] !== undefined && levelOf(entry.rules[rule]) !== 'off' && levelOf(entry.rules[rule]) !== 0);",
    'const raise = (setting) => (Array.isArray(setting) ? [severity, ...setting.slice(1)] : severity);',
    'const scopedByRepo = configs.some(isOn);',
    "const slash = rule.lastIndexOf('/');",
    'const pluginName = slash === -1 ? null : rule.slice(0, slash);',
    'const registering = pluginName === null ? [] : configs.filter((entry) => entry && entry.plugins && Object.prototype.hasOwnProperty.call(entry.plugins, pluginName));',
    'if (!scopedByRepo && pluginName !== null && registering.length === 0) {',
    `  throw new Error('No config object in ' + ${JSON.stringify(
      rootConfigPath,
    )} + ' registers plugin "' + pluginName + '" for rule "' + rule + '"');`,
    '}',
    'const forcing = scopedByRepo',
    '  ? []',
    '  : pluginName === null',
    '    ? [{ rules: { [rule]: severity } }]',
    '    : registering.map((entry) => ({',
    '        ...(entry.files ? { files: entry.files } : {}),',
    '        ...(entry.ignores ? { ignores: entry.ignores } : {}),',
    '        rules: { [rule]: severity },',
    '      }));',
    'const kept = configs.map((entry) => (isOn(entry) ? { ...entry, rules: { ...entry.rules, [rule]: raise(entry.rules[rule]) } } : entry));',
    'module.exports = [...kept, ...forcing];',
    '',
  ].join('\n');
