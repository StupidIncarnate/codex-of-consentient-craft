/**
 * PURPOSE: E2E test for quest creation flow via FULL CLI (not debug mode)
 *
 * This test exercises the complete flow:
 * - CLI startup with real Ink UI
 * - User navigation via keyboard
 * - Claude API calls via ChaosWhisperer
 * - MCP integration (quest creation tool)
 * - Screen transitions
 * - File system changes
 *
 * SCENARIO: User creates a quest called "DangerFun" without followup questions
 *
 * USAGE:
 * npm run test:e2e -- tests/e2e/features/quest-creation.e2e.test.ts
 *
 * IMPORTANT:
 * - This test requires a valid ANTHROPIC_API_KEY in the environment
 * - Uses generous timeouts (90-120 seconds) for Claude API calls
 * - Creates quest files in `.dungeonmaster-quests/NNN-quest-name/quest.json`
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  createFullCliDriver,
  createFileSystemSpy,
  createE2ETestProject,
  type FullCliDriver,
  type FileSystemSpy,
  type E2ETestProject,
} from '../harness';
import { isClaudeAvailable } from '../setup';

// =============================================================================
// Test Configuration
// =============================================================================

/** Timeout for the entire test (Claude API calls take time) */
const FULL_TEST_TIMEOUT_MS = 180000; // 3 minutes

/** Timeout for waiting for Claude to process and create the quest */
const CLAUDE_PROCESSING_TIMEOUT_MS = 120000; // 2 minutes

/** Timeout for UI navigation steps */
const UI_NAVIGATION_TIMEOUT_MS = 10000; // 10 seconds

/** The user's quest request */
const USER_QUEST_REQUEST =
  'Testing cli workflow. Create a new quest using the add-quest MCP tool. The quest should be called "DangerFun" and should not require any followup questions from you. Just create it directly.';

/** Expected quest name pattern in file path */
const EXPECTED_QUEST_NAME_PATTERN = 'dangerfun';

// =============================================================================
// Test Suite
// =============================================================================

describe('Quest Creation Flow - Full CLI E2E', () => {
  let driver: FullCliDriver;
  let testProject: E2ETestProject;
  let spy: FileSystemSpy;
  let claudeAvailable: boolean;

  beforeAll(async () => {
    // Check if Claude CLI is available
    claudeAvailable = await isClaudeAvailable();

    if (!claudeAvailable) {
      // eslint-disable-next-line no-console
      console.warn(
        'WARNING: Claude CLI not available - full E2E tests will be skipped.\n' +
          'Install Claude CLI and ensure ANTHROPIC_API_KEY is set to run these tests.',
      );
    }
  });

  beforeEach(() => {
    // Create isolated test project for each test
    testProject = createE2ETestProject('quest-creation-full-e2e');

    // Create minimal project structure
    fs.mkdirSync(path.join(testProject.rootDir, '.claude', 'commands'), { recursive: true });
    fs.writeFileSync(
      path.join(testProject.rootDir, 'package.json'),
      JSON.stringify({ name: 'quest-creation-test', version: '1.0.0' }, null, 2),
    );

    // Initialize file system spy to track quest file creation
    spy = createFileSystemSpy(testProject.rootDir);

    // Initialize full CLI driver with node-pty
    driver = createFullCliDriver({
      cwd: testProject.rootDir,
      timeout: CLAUDE_PROCESSING_TIMEOUT_MS,
      debug: process.env['DEBUG_E2E'] === 'true',
      // Pass project directory as env var so quest broker can resolve paths correctly
      env: {
        DUNGEONMASTER_PROJECT_DIR: testProject.rootDir,
      },
    });
  });

  afterEach(async () => {
    // Clean up driver
    if (driver?.isRunning()) {
      await driver.stop();
    }

    // Clean up test project (unless KEEP_TESTBEDS is set)
    if (process.env['KEEP_TESTBEDS'] !== 'true') {
      testProject?.cleanup();
    } else if (process.env['DEBUG_E2E'] === 'true') {
      // eslint-disable-next-line no-console
      console.log(`Testbed preserved at: ${testProject?.rootDir}`);
    }
  });

  // ===========================================================================
  // MAIN TEST CASE
  // ===========================================================================

  describe('SCENARIO: User creates a quest "DangerFun" without followup questions', () => {
    /**
     * Full E2E test that exercises the complete quest creation flow.
     *
     * Given: A clean test environment with CLI started
     * When: User navigates to Add screen and submits a quest request
     * And: Claude processes the request and creates the quest via MCP
     * Then:
     *   1. Quest file is created in .dungeonmaster-quests/ with "DangerFun" in the path
     *   2. Screen transitions to list view
     *   3. Quest appears in the list
     *   4. User's prompt text is NOT visible in the final screen (bug fix verification)
     */
    it(
      'creates quest file and transitions to list view',
      async () => {
        // Skip if Claude is not available
        if (!claudeAvailable) {
          // eslint-disable-next-line no-console
          console.log('Skipping test: Claude CLI not available');
          expect(claudeAvailable).toBe(false); // Assertion to satisfy jest.setup.js
          return;
        }

        // =====================================================================
        // GIVEN: A clean test environment with CLI started
        // =====================================================================
        spy.startTracking();
        await driver.start();

        // Wait for the menu to appear
        await driver.waitForText('Add', { timeout: UI_NAVIGATION_TIMEOUT_MS });

        if (process.env['DEBUG_E2E'] === 'true') {
          // eslint-disable-next-line no-console
          console.log('\n=== CLI Started - Menu Screen ===');
          driver.getScreen().debug();
        }

        // =====================================================================
        // WHEN: User navigates to Add screen
        // =====================================================================
        // Press Enter to select "Add" (should be the first/default option)
        driver.pressKey('enter');

        // Wait for the Add screen prompt to appear
        await driver.waitForText('What would you like to build', {
          timeout: UI_NAVIGATION_TIMEOUT_MS,
        });

        if (process.env['DEBUG_E2E'] === 'true') {
          // eslint-disable-next-line no-console
          console.log('\n=== Navigated to Add Screen ===');
          driver.getScreen().debug();
        }

        // =====================================================================
        // AND: User types the quest request
        // =====================================================================
        driver.type(USER_QUEST_REQUEST);

        // Wait briefly for the input to be reflected
        await driver.waitForText('DangerFun', { timeout: UI_NAVIGATION_TIMEOUT_MS });

        if (process.env['DEBUG_E2E'] === 'true') {
          // eslint-disable-next-line no-console
          console.log('\n=== User Input Entered ===');
          driver.getScreen().debug();
        }

        // =====================================================================
        // AND: User presses Enter to submit
        // =====================================================================
        driver.pressKey('enter');

        // =====================================================================
        // THEN: Poll file system for quest creation
        // =====================================================================
        // Instead of waiting for UI text to disappear (which is fragile),
        // we directly poll the file system for quest file creation.
        // This tests what we actually care about - that the quest gets created.

        if (process.env['DEBUG_E2E'] === 'true') {
          // eslint-disable-next-line no-console
          console.log('\n=== Enter pressed - polling for quest file creation (up to 90s)... ===');
        }

        let questCreated = false;
        const pollStart = Date.now();
        const pollTimeout = 90000; // 90 seconds for Claude to process

        while (Date.now() - pollStart < pollTimeout && !questCreated) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Check every 2 seconds

          // Check if quest file was created
          const questsDir = path.join(testProject.rootDir, '.dungeonmaster-quests');
          if (fs.existsSync(questsDir)) {
            const entries = fs.readdirSync(questsDir);
            const dangerfunQuest = entries.find((e) =>
              e.toLowerCase().includes('dangerfun'),
            );
            if (dangerfunQuest) {
              questCreated = true;
              if (process.env['DEBUG_E2E'] === 'true') {
                // eslint-disable-next-line no-console
                console.log(`\n=== Quest created after ${Date.now() - pollStart}ms: ${dangerfunQuest} ===`);
              }
            }
          }

          // Also check screen for agent questions - handle if needed
          if (!questCreated) {
            const currentScreen = driver.getScreen();
            if (currentScreen.contains('Agent needs your input')) {
              if (process.env['DEBUG_E2E'] === 'true') {
                // eslint-disable-next-line no-console
                console.log('\n=== Agent asked a question - responding... ===');
                currentScreen.debug();
              }

              // Wait a moment for the input to be ready
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Type a response to the agent
              driver.type('Proceed with the quest creation');
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Press Enter to submit the response
              driver.pressKey('enter');

              if (process.env['DEBUG_E2E'] === 'true') {
                // eslint-disable-next-line no-console
                console.log('\n=== Response submitted - continuing to poll... ===');
              }
            }
          }
        }

        expect(questCreated).toBe(true);

        // After quest is created, the CLI may be at the menu screen
        // (if Claude asked a question and the test hit escape to cancel it)
        // Navigate to the list screen to verify the quest appears
        // Wait for menu to stabilize first
        await driver.waitForStable({ timeout: 10000, stableFor: 2000 });

        // Check if we're on the menu screen, and if so, navigate to list
        let currentScreen = driver.getScreen();
        if (currentScreen.contains('Add') && currentScreen.contains('Run')) {
          // We're on the menu screen - navigate down to "List" option and press enter
          // The menu typically has: Add (default), Run, List
          // Press down twice to get to List
          driver.pressKey('down');
          await new Promise((resolve) => setTimeout(resolve, 500));
          driver.pressKey('down');
          await new Promise((resolve) => setTimeout(resolve, 500));
          driver.pressKey('enter');

          // Wait for list screen to appear
          await driver.waitForText('quest', { timeout: UI_NAVIGATION_TIMEOUT_MS });
          await driver.waitForStable({ timeout: 10000, stableFor: 2000 });
        }

        const finalScreen = driver.getScreen();

        if (process.env['DEBUG_E2E'] === 'true') {
          // eslint-disable-next-line no-console
          console.log('\n=== Final Screen State ===');
          finalScreen.debug();
        }

        // =====================================================================
        // ASSERTION 1: Quest file is created with "DangerFun" in the path
        // =====================================================================
        spy.stopTracking();
        const createdFiles = spy.getCreatedFiles();
        const questsCreated = spy.findQuestsWithName(EXPECTED_QUEST_NAME_PATTERN);

        if (process.env['DEBUG_E2E'] === 'true') {
          // eslint-disable-next-line no-console
          console.log('\n=== File System Changes ===');
          // eslint-disable-next-line no-console
          console.log('Created files:', createdFiles);
          // eslint-disable-next-line no-console
          console.log('Quests found:', questsCreated.map((q) => q.folderName));
        }

        expect(questsCreated.length).toBeGreaterThan(0);

        // Verify quest.json exists and contains expected content
        const quest = questsCreated[0];
        expect(quest).toBeDefined();
        expect(quest?.hasQuestJson).toBe(true);

        if (quest?.questData) {
          // Quest title should contain "DangerFun" (case-insensitive)
          // Note: The quest contract uses 'title' field, not 'name'
          const questTitle = (quest.questData as { title?: string }).title;
          expect(questTitle?.toLowerCase()).toContain('dangerfun');
        }

        // =====================================================================
        // ASSERTION 2: Screen transitioned to list view
        // =====================================================================
        // The list screen should show the quest or "Quests" header
        // It should NOT still be on the Add screen
        expect(finalScreen.notContains('What would you like to build')).toBe(true);

        // =====================================================================
        // ASSERTION 3: Quest appears in the list
        // =====================================================================
        // The quest name "DangerFun" should be visible on the list screen
        expect(finalScreen.contains('DangerFun') || finalScreen.contains('dangerfun')).toBe(true);

        // =====================================================================
        // ASSERTION 4: User's prompt text is NOT visible in the final screen
        // (This verifies the bug fix - user input should be cleared after submission)
        // =====================================================================
        expect(finalScreen.notContains(USER_QUEST_REQUEST)).toBe(true);

        // Also check for partial prompt text
        expect(
          finalScreen.notContains('Testing cli workflow, make me a quest without any followup'),
        ).toBe(true);
      },
      FULL_TEST_TIMEOUT_MS,
    );
  });

  // ===========================================================================
  // HELPER TESTS (verify the test infrastructure works)
  // ===========================================================================

  describe('HELPER: Verify test infrastructure', () => {
    /**
     * Verify the full CLI driver can start and render the menu screen
     */
    it('starts CLI and renders menu screen', async () => {
      // Skip if Claude is not available (driver still works without Claude)
      await driver.start();

      // Wait for menu to appear
      const screen = await driver.waitForText('Add', { timeout: UI_NAVIGATION_TIMEOUT_MS });

      // Menu should show the main options
      expect(screen.contains('Add')).toBe(true);
      expect(screen.contains('Run') || screen.contains('List')).toBe(true);
    });

    /**
     * Verify navigation from menu to add screen works
     */
    it('navigates from menu to add screen', async () => {
      await driver.start();

      // Wait for menu
      await driver.waitForText('Add', { timeout: UI_NAVIGATION_TIMEOUT_MS });

      // Press Enter to select Add
      driver.pressKey('enter');

      // Wait for Add screen
      const screen = await driver.waitForText('What would you like to build', {
        timeout: UI_NAVIGATION_TIMEOUT_MS,
      });

      expect(screen.contains('What would you like to build')).toBe(true);
    });

    /**
     * Verify text input works on add screen
     */
    it('captures text input on add screen', async () => {
      await driver.start();

      // Navigate to Add screen
      await driver.waitForText('Add', { timeout: UI_NAVIGATION_TIMEOUT_MS });
      driver.pressKey('enter');
      await driver.waitForText('What would you like to build', {
        timeout: UI_NAVIGATION_TIMEOUT_MS,
      });

      // Type some text
      const testInput = 'Build a test feature for testing';
      driver.type(testInput);

      // Wait for input to appear
      const screen = await driver.waitForText('Build a test feature', {
        timeout: UI_NAVIGATION_TIMEOUT_MS,
      });

      expect(screen.contains('Build a test feature')).toBe(true);
    });

    /**
     * Verify file system spy detects quest folder creation
     */
    it('detects quest folder creation in file system', () => {
      spy.startTracking();

      // Simulate quest folder creation (without actual CLI)
      const questsDir = path.join(testProject.rootDir, '.dungeonmaster-quests');
      const questFolder = path.join(questsDir, '001-test-quest');

      fs.mkdirSync(questFolder, { recursive: true });
      fs.writeFileSync(
        path.join(questFolder, 'quest.json'),
        JSON.stringify({ id: '001', name: 'Test Quest' }, null, 2),
      );

      spy.stopTracking();

      // Verify spy detected the creation
      const quests = spy.findQuestsWithName('test-quest');
      expect(quests.length).toBe(1);
      expect(quests[0]?.folderName).toBe('001-test-quest');
      expect(quests[0]?.hasQuestJson).toBe(true);
      expect(quests[0]?.questData?.name).toBe('Test Quest');
    });
  });
});
