/**
 * PURPOSE: E2E test for quest creation flow without followup questions
 *
 * USAGE:
 * npm run test:e2e -- quest-creation
 */

import { createPtyClient, createE2ETestbed } from '../harness';
import type { PtyClient, E2ETestbed } from '../harness';

describe('Quest creation flow', () => {
  let testbed: E2ETestbed;
  let client: PtyClient;

  beforeEach(() => {
    testbed = createE2ETestbed({ baseName: 'quest-create' });
    testbed.runDungeonmasterInit();
    client = createPtyClient();
  });

  afterEach(() => {
    client.kill();
    testbed.cleanup();
  });

  it('creates quest and navigates to list view with clean screen', async () => {
    // Spawn CLI
    await client.spawn({ cwd: testbed.projectPath });

    // Wait for menu to load
    await client.waitForText('Add - Add a new quest');

    // Navigate to Add screen
    client.pressKey('enter');
    await client.waitForText('What would you like to build');

    // Type prompt and submit
    const prompt =
      'Testing cli workflow, make me a quest without any followup questions. Call it DangerFun';
    client.type(prompt);
    client.pressKey('enter');

    // Wait for Claude to complete - should land on List view
    await client.waitForText('Quests', 180000);

    const screen = client.getScreen();

    // EXPECTED: Should be on List view showing the quest
    expect(screen).toContain('Quests');
    expect(screen).toContain('DangerFun');
    expect(screen).toContain('[in_progress]');
    expect(screen).toContain("Press Escape or 'q' to go back");

    // BUG ASSERTION: Old content should NOT be visible
    expect(screen).not.toContain('What would you like to build');
    expect(screen).not.toContain('Testing cli workflow');

    // BUG ASSERTION: Should NOT be on menu
    expect(screen).not.toContain('Add - Add a new quest');

    // File system assertion
    const folders = testbed.listQuestFolders();
    expect(folders.length).toBe(1);
    expect(folders[0]).toMatch(/danger-fun/);

    const quest = testbed.getQuestByFolder(folders[0]);
    expect(quest).not.toBeNull();
    expect(quest?.title).toMatch(/DangerFun/i);
  });
});
