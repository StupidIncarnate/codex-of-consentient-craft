// Only the brand rules, for `eslint --fix` over contract files. Every other rule is stripped so --fix touches nothing else,
// and unused-disable reporting is off so --fix does not delete other rules' eslint-disable comments.
require('tsx/cjs');
const base = require('../../../eslint.config.js');
const { ruleRequireObjectContractBrandsIndexedBroker } = require('../../../packages/eslint-plugin/src/brokers/rule/require-object-contract-brands-indexed/rule-require-object-contract-brands-indexed-broker.ts');
const only = process.env.BRAND_FIX_RULES ?? 'r2';
const rules = {};
if (only.includes('r2')) rules['@dungeonmaster/require-object-contract-brands'] = 'error';
if (only.includes('r7')) rules['bigbang/require-object-contract-brands-indexed'] = 'error';
if (only.includes('r8')) rules['@dungeonmaster/enforce-owner-field-reuse'] = 'error';
module.exports = [
  ...base.map(({ rules: _r, ...rest }) => rest),
  {
    files: ['packages/**/*.ts', 'packages/**/*.tsx'],
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    plugins: { bigbang: { rules: { 'require-object-contract-brands-indexed': ruleRequireObjectContractBrandsIndexedBroker() } } },
    rules,
  },
];
