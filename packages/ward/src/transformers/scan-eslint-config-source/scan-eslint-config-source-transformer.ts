/**
 * PURPOSE: Writes the source of the wrapper ESLint config a scan runs under: the repo's own config
 * loaded unchanged, plus entries that put the one rule at `error` after everything else, so a rule
 * registered `off` is scanned too. Reach for this rather than ESLint's `--rule` flag, which builds
 * one file-less config object and dies on every linted file whose config never registered the
 * rule's plugin.
 *
 * USAGE:
 * scanEslintConfigSourceTransformer({ rule: ScanRuleNameStub(), rootConfigPath: AbsoluteFilePathStub({ value: '/repo/eslint.config.js' }) });
 * // Returns CommonJS source that exports the repo's config array followed by the forcing entries
 *
 * A plugin rule gets one entry per config object that registers its plugin, carrying that object's
 * own `files` and `ignores`: only those files can resolve the rule, and an entry that reached
 * further would throw on the rest. A core rule needs no plugin and gets one global entry. Severity
 * alone keeps whatever options the repo config gave the rule. A plugin no config object registers
 * makes the wrapper throw, so ESLint exits 2 and the scan fails, where a silent empty scan would
 * read as a clean package.
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { ScanRuleName } from '../../contracts/scan-rule-name/scan-rule-name-contract';
import { scanStatics } from '../../statics/scan/scan-statics';

export const scanEslintConfigSourceTransformer = ({
  rule,
  rootConfigPath,
}: {
  rule: ScanRuleName;
  rootConfigPath: AbsoluteFilePath;
}): string =>
  [
      `const base = require(${JSON.stringify(String(rootConfigPath))});`,
      'const configs = Array.isArray(base) ? base : base.default;',
      `const rule = ${JSON.stringify(String(rule))};`,
      `const forced = { [rule]: ${JSON.stringify(scanStatics.eslint.severity)} };`,
      "const slash = rule.lastIndexOf('/');",
      'const pluginName = slash === -1 ? null : rule.slice(0, slash);',
      'const registering = pluginName === null ? [] : configs.filter((entry) => entry && entry.plugins && Object.prototype.hasOwnProperty.call(entry.plugins, pluginName));',
      'if (pluginName !== null && registering.length === 0) {',
      `  throw new Error('No config object in ' + ${JSON.stringify(
        String(rootConfigPath),
      )} + ' registers plugin "' + pluginName + '" for rule "' + rule + '"');`,
      '}',
      'const forcing = pluginName === null',
      '  ? [{ rules: forced }]',
      '  : registering.map((entry) => ({',
      '      ...(entry.files ? { files: entry.files } : {}),',
      '      ...(entry.ignores ? { ignores: entry.ignores } : {}),',
      '      rules: forced,',
      '    }));',
      'module.exports = [...configs, ...forcing];',
      '',
    ].join('\n');
