/**
 * PURPOSE: E2E test for MCP ask-user-question flow
 *
 * USAGE:
 * npm run test:e2e -- ask-user-question
 */

import { createPtyClient, createE2ETestbed } from '../harness';
import type { PtyClient, E2ETestbed } from '../harness';

describe('Ask user question flow', () => {
  let testbed: E2ETestbed;
  let client: PtyClient;

  beforeEach(async () => {
    testbed = createE2ETestbed({ baseName: 'ask-question' });
    await testbed.runDungeonmasterInit();
    client = createPtyClient();
  });

  afterEach(() => {
    client?.kill();
    testbed?.cleanup();
  });

  it('shows answer screen when Claude asks a question via MCP', async () => {
    // Spawn CLI
    await client.spawn({ cwd: testbed.projectPath });

    // Wait for menu to load
    await client.waitForText('Add - Add a new quest');

    // Navigate to Add screen
    client.pressKey('enter');
    await client.waitForText('What would you like to build');

    // Type prompt that instructs Claude to ask a question
    const prompt =
      "Testing cli workflow. I want to do a simple hello world. Ask me the following question using the mcp workflow 'Why hello world?'";
    client.type(prompt);
    client.pressKey('enter');

    // Wait for Answer screen to appear with the question
    await client.waitForText('Why hello world?', 180000);

    const screen = client.getScreen();

    // EXPECTED: Should be on Answer screen
    expect(screen).toContain('Why hello world?');

    // Should show answer input area (not menu, not list)
    expect(screen).not.toContain('Add - Add a new quest');
    expect(screen).not.toContain('Quests');
  });
});
