// Only the brand rules, for `eslint --fix` over contract files. Every other rule is stripped so --fix touches nothing else,
// and unused-disable reporting is off so --fix does not delete other rules' eslint-disable comments.
// BRAND_FIX_RULES picks the rules: r2 (require-object-contract-brands), r7 (require-object-contract-brands-indexed),
// r8 (enforce-owner-field-reuse); any mix, e.g. "r2,r7".
//
// It extends the TARGET repo's own eslint.config.js: the root is MIGRATE_ROOT, else the cwd (phase34-scripts/lib/port-config.cjs),
// and the rule prefix is MIGRATE_ESLINT_PREFIX (default @dungeonmaster/). R7 comes from the plugin when the plugin
// registers it; otherwise from <root>/packages/eslint-plugin's source, which is where it lived before it was registered.
//   MIGRATE_ROOT=/path/to/repo BRAND_FIX_RULES=r2 node_modules/.bin/eslint -c <this file> --fix packages/<pkg>/src/contracts
const fs = require('fs');
const path = require('path');
const cfg = require('../phase34-scripts/lib/port-config.cjs');

try {
  cfg.rootRequire('tsx/cjs');
} catch {
  // No tsx in the target repo: its eslint.config.js loads compiled plugins only.
}
const base = require(path.join(cfg.ROOT, 'eslint.config.js'));
const P = cfg.ESLINT_PREFIX;
const pluginKey = P.replace(/\/$/u, '');
const R7 = 'require-object-contract-brands-indexed';
const r7Registered = base.some((c) => c.plugins?.[pluginKey]?.rules?.[R7] !== undefined);
const only = process.env.BRAND_FIX_RULES ?? 'r2';
const rules = {};
const extra = {};
if (only.includes('r2')) rules[`${P}require-object-contract-brands`] = 'error';
if (only.includes('r7')) {
  if (r7Registered) rules[`${P}${R7}`] = 'error';
  else {
    const src = path.join(cfg.ROOT, 'packages/eslint-plugin/src/brokers/rule', R7, `rule-${R7}-broker.ts`);
    if (!fs.existsSync(src)) throw new Error(`r7: the plugin does not register ${R7} and ${src} does not exist`);
    const { ruleRequireObjectContractBrandsIndexedBroker } = require(src);
    extra.plugins = { bigbang: { rules: { [R7]: ruleRequireObjectContractBrandsIndexedBroker() } } };
    rules[`bigbang/${R7}`] = 'error';
  }
}
if (only.includes('r8')) rules[`${P}enforce-owner-field-reuse`] = 'error';
module.exports = [
  ...base.map(({ rules: _r, ...rest }) => rest),
  {
    files: ['packages/**/*.ts', 'packages/**/*.tsx'],
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    ...extra,
    rules,
  },
];
