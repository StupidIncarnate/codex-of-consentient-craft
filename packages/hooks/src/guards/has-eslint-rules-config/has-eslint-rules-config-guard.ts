/**
 * PURPOSE: Checks if an ESLint config object contains any rules
 *
 * USAGE:
 * const result = hasEslintRulesConfigGuard({ config: eslintConfig });
 * // Returns true if config has a non-empty rules object
 */
export const hasEslintRulesConfigGuard = ({ config }: { config?: unknown }): boolean => {
  if (typeof config !== 'object' || config === null) {
    return false;
  }
  const rules: unknown = Reflect.get(config, 'rules');
  return typeof rules === 'object' && rules !== null && Object.keys(rules).length > 0;
};
