/**
 * PURPOSE: Defines Playwright extraction methods and their auto-retrying assertion replacements
 *
 * USAGE:
 * import { playwrightExtractionMethodsStatics } from './statics/playwright-extraction-methods/playwright-extraction-methods-statics';
 * const replacement = playwrightExtractionMethodsStatics.methods.textContent; // 'toHaveText'
 *
 * WHEN-TO-USE: When implementing ESLint rules that enforce Playwright auto-retrying assertions
 */
export const playwrightExtractionMethodsStatics = {
  methods: {
    textContent: 'toHaveText',
    inputValue: 'toHaveValue',
    count: 'toHaveCount',
  },
} as const;
