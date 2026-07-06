/**
 * PURPOSE: Root jest.config.js `dungeonmaster init` scaffolds so a project's tests inherit the
 * dungeonmaster ts-jest transformers (registerMock/proxy support) and auto-reset setup by spreading
 * the published @dungeonmaster/testing base. Per-package configs copy this, adjusting roots.
 *
 * USAGE:
 * jestConfigTemplateStatics.content;
 * // Returns the jest.config.js file body spreading @dungeonmaster/testing/jest-config-base
 */

export const jestConfigTemplateStatics = {
  content: `const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  roots: ['<rootDir>/src'],
};
`,
} as const;
