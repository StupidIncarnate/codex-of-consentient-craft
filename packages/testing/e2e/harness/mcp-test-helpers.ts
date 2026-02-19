/**
 * PURPOSE: Claude settings helpers for E2E tests
 * USAGE: Used by createE2ETestProject to set up Claude settings for test CLI instances
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Writes Claude settings to a test project directory
 */
export const writeClaudeSettings = (projectDir: string): void => {
  const claudeDir = join(projectDir, '.claude');
  if (!existsSync(claudeDir)) {
    mkdirSync(claudeDir, { recursive: true });
  }

  const settings = {
    permissions: {
      allow: ['Bash(curl:*)'],
      deny: [],
    },
  };

  writeFileSync(join(claudeDir, 'settings.json'), JSON.stringify(settings, null, 2));
};
