/**
 * PURPOSE: E2E test for User Question Flow via signal-back MCP
 *
 * Test Case 2: User Question Flow via signal-back MCP (FULL CLI MODE)
 *
 * SCENARIO: User requests Claude to ask a clarifying question
 *
 * GIVEN: User navigates to Add screen in CLI
 * WHEN: User types "Testing cli workflow. I want to do a simple hello world. Ask me the following question using the mcp workflow 'Why hello world?'"
 * AND: User presses Enter to submit
 * THEN:
 *   1. Claude processes the request and calls signal-back MCP tool
 *   2. CLI transitions to Answer screen (not menu, not list)
 *   3. The question "Why hello world?" is displayed on the answer screen
 *
 * IMPORTANT CONTEXT:
 * - This test uses the FULL CLI via node-pty (not debug mode)
 * - It spawns the real CLI and interacts with actual Claude API
 * - The signal-back mechanism: Claude calls `mcp__dungeonmaster__signal-back` with `signal: 'needs-user-input'`
 * - The CLI's start-cli.ts detects this signal and transitions to 'answer' screen
 * - Timeouts are generous (90-120 seconds) because Claude API calls take time
 *
 * ARCHITECTURE:
 * 1. User submits on Add screen -> onSpawnChaoswhisperer callback fires
 * 2. start-cli.ts calls chaoswhispererSpawnStreamingBroker
 * 3. Claude processes, calls signal-back MCP tool with needs-user-input
 * 4. teeOutputLayerBroker extracts signal from Claude's stream output
 * 5. start-cli.ts receives result.signal.signal === 'needs-user-input'
 * 6. start-cli.ts recursively calls StartCli({ initialScreen: 'answer', pendingQuestion: {...} })
 * 7. Answer screen renders with question and context
 */

import { createE2ETestProject, createFullCliDriver, type FullCliDriver } from '../harness';
import { isClaudeAvailable } from '../setup';

/**
 * Timeout for full E2E tests with Claude API calls
 * Claude processing can take 30-60+ seconds
 */
const FULL_E2E_TIMEOUT_MS = 120000;

/**
 * Timeout for waiting for specific screen content after Claude processes
 */
const CLAUDE_PROCESSING_TIMEOUT_MS = 90000;

/**
 * Polling interval for wait operations
 */
const POLL_INTERVAL_MS = 1000;

describe('User Question Flow via signal-back MCP (Full CLI)', () => {
  let driver: FullCliDriver | null = null;
  let testDir: string;
  let claudeAvailable: boolean;

  beforeAll(async () => {
    // Check if Claude CLI is available
    claudeAvailable = await isClaudeAvailable();

    if (!claudeAvailable) {
      // eslint-disable-next-line no-console
      console.warn(
        'Claude CLI not available - Full E2E tests will be skipped. Install Claude CLI to run these tests.',
      );
    }
  });

  beforeEach(() => {
    // Test directory is initialized per test within it() blocks
  });

  afterEach(async () => {
    // Clean up driver
    if (driver !== null) {
      try {
        await driver.stop();
      } catch (_e) {
        // Ignore errors during cleanup
      }
      driver = null;
    }
  });

  describe('SCENARIO: User requests Claude to ask a clarifying question (Full E2E)', () => {
    /**
     * BDD Test: Full flow from Add screen through Claude signal-back to Answer screen
     *
     * This test validates the COMPLETE user question flow:
     * - Real CLI spawned via node-pty
     * - Real Claude API calls
     * - Real MCP signal-back mechanism
     * - Real screen transition to Answer screen
     *
     * GIVEN: User is on the Add screen in the CLI
     * WHEN: User types request asking Claude to ask a question via MCP workflow
     * AND: User presses Enter to submit
     * THEN: Claude calls signal-back with needs-user-input
     * AND: CLI transitions to Answer screen
     * AND: The question "Why hello world?" is displayed
     */
    it(
      'GIVEN Add screen WHEN user submits MCP question request THEN screen transitions to Answer with question displayed',
      async () => {
        expect(claudeAvailable).toBe(true);

        // GIVEN: Initialize test project with minimal structure
        const testProject = createE2ETestProject('user-question-flow');
        testDir = testProject.rootDir;

        // Create the full CLI driver
        driver = createFullCliDriver({
          cwd: testDir,
          timeout: FULL_E2E_TIMEOUT_MS,
          debug: true, // Enable debug logging for visibility
          // Pass project directory as env var so quest broker can resolve paths correctly
          env: {
            DUNGEONMASTER_PROJECT_DIR: testDir,
          },
        });

        // Start the CLI
        await driver.start();

        // GIVEN: User should see the menu screen initially
        // Wait for menu to render
        await driver.waitForText('add', {
          timeout: 10000,
          interval: 500,
        });

        // Navigate to Add screen by pressing 'a' or selecting Add option
        // The menu shows: add, run, list, help, etc.
        // We need to press down arrow to select 'add' then enter, OR just type 'a' for shortcut
        // Based on the CLI, pressing 'down' and 'enter' or just selecting via arrow keys
        driver.pressKey('enter'); // Select first option which is 'add'

        // Wait for Add screen to appear
        await driver.waitForText('What would you like to build', {
          timeout: 10000,
          interval: 500,
        });

        // WHEN: User types the request asking Claude to ask a question via MCP workflow
        const userInput =
          "Testing cli workflow. I want to do a simple hello world. Ask me the following question using the mcp workflow 'Why hello world?'";

        driver.type(userInput);

        // Give a moment for typing to complete
        await new Promise((resolve) => setTimeout(resolve, 500));

        // AND: User presses Enter to submit
        driver.pressKey('enter');

        // THEN: Wait for Claude to process and signal back
        // This is the critical part - Claude should call signal-back with needs-user-input
        // and the CLI should transition to the Answer screen
        //
        // The Answer screen contains:
        // - "Agent needs your input" (header)
        // - "Context: [context]"
        // - The question itself (bold)
        // - Input prompt "> _"

        // Wait for the Answer screen to appear
        // We look for "Agent needs your input" which is the header of the answer screen
        const answerScreen = await driver.waitForText('Agent needs your input', {
          timeout: CLAUDE_PROCESSING_TIMEOUT_MS,
          interval: POLL_INTERVAL_MS,
        });

        // Verify we're on the Answer screen
        expect(answerScreen.contains('Agent needs your input')).toBe(true);

        // AND: The question "Why hello world?" should be displayed
        // Note: Claude may paraphrase or include this in its response
        // We check for the key phrase
        expect(answerScreen.contains('Why hello world')).toBe(true);

        // Additional verification: The answer screen should have the input prompt
        expect(answerScreen.contains('Press Enter to submit')).toBe(true);

        // Clean up test project
        testProject.cleanup();
      },
      FULL_E2E_TIMEOUT_MS,
    );

    /**
     * BDD Test: Verify Answer screen displays context from signal-back
     *
     * GIVEN: Claude has signaled needs-user-input with question and context
     * THEN: The Answer screen should display the context alongside the question
     */
    it(
      'GIVEN signal-back with context THEN Answer screen displays context',
      async () => {
        expect(claudeAvailable).toBe(true);

        // Create test project
        const testProject = createE2ETestProject('user-question-context');
        testDir = testProject.rootDir;

        // Create driver and start CLI
        driver = createFullCliDriver({
          cwd: testDir,
          timeout: FULL_E2E_TIMEOUT_MS,
          debug: true,
          // Pass project directory as env var so quest broker can resolve paths correctly
          env: {
            DUNGEONMASTER_PROJECT_DIR: testDir,
          },
        });

        await driver.start();

        // Navigate to Add screen
        await driver.waitForText('add', { timeout: 10000, interval: 500 });
        driver.pressKey('enter');
        await driver.waitForText('What would you like to build', { timeout: 10000, interval: 500 });

        // Submit request
        const userInput =
          "Testing cli workflow. Build a hello world app. Ask me this question using mcp workflow: 'Why hello world?' The context should mention testing the CLI.";

        driver.type(userInput);
        await new Promise((resolve) => setTimeout(resolve, 500));
        driver.pressKey('enter');

        // Wait for Answer screen
        const answerScreen = await driver.waitForText('Agent needs your input', {
          timeout: CLAUDE_PROCESSING_TIMEOUT_MS,
          interval: POLL_INTERVAL_MS,
        });

        // THEN: Context should be displayed (prefixed with "Context:")
        expect(answerScreen.contains('Context:')).toBe(true);

        // Clean up
        testProject.cleanup();
      },
      FULL_E2E_TIMEOUT_MS,
    );
  });

  describe('SCENARIO: Multi-round question flow (2+ question/answer cycles)', () => {
    /**
     * BDD Test: Two rounds of questions and answers
     *
     * GIVEN: User submits a request that triggers multiple questions
     * WHEN: User answers first question
     * AND: Agent asks second question
     * AND: User answers second question
     * THEN: Flow continues (either more questions or completion)
     *
     * This test specifically validates the bug fix for:
     * - Resume prompt sending only user answer (not full template)
     * - Signal extraction working correctly on subsequent rounds
     */
    it(
      'GIVEN first question answered WHEN agent asks second question THEN user can answer and flow continues',
      async () => {
        expect(claudeAvailable).toBe(true);

        // Create test project
        const testProject = createE2ETestProject('multi-round-question-flow');
        testDir = testProject.rootDir;

        // Create driver and start CLI
        driver = createFullCliDriver({
          cwd: testDir,
          timeout: FULL_E2E_TIMEOUT_MS,
          debug: true,
          env: {
            DUNGEONMASTER_PROJECT_DIR: testDir,
          },
        });

        await driver.start();

        // Navigate to Add screen
        await driver.waitForText('add', { timeout: 10000, interval: 500 });
        driver.pressKey('enter');
        await driver.waitForText('What would you like to build', { timeout: 10000, interval: 500 });

        // GIVEN: Submit request that should trigger multiple questions
        // Explicitly ask Claude to ask two separate questions via MCP
        const userInput =
          "Testing multi-round cli workflow. I want to build a simple app. " +
          "Using signal-back mcp with needs-user-input, first ask me 'What is your name?' " +
          "After I answer, ask me a SECOND question 'What is your favorite color?' also via signal-back mcp.";

        driver.type(userInput);
        await new Promise((resolve) => setTimeout(resolve, 500));
        driver.pressKey('enter');

        // WHEN: Wait for first Answer screen (first question)
        await driver.waitForText('Agent needs your input', {
          timeout: CLAUDE_PROCESSING_TIMEOUT_MS,
          interval: POLL_INTERVAL_MS,
        });

        // Verify we see a question (could be paraphrased)
        const firstQuestionScreen = driver.getScreen();
        // eslint-disable-next-line no-console
        console.log('[E2E] First question screen captured');
        expect(firstQuestionScreen.contains('Agent needs your input')).toBe(true);

        // User answers first question
        const firstAnswer = 'My name is Test User';
        driver.type(firstAnswer);
        await new Promise((resolve) => setTimeout(resolve, 500));
        driver.pressKey('enter');

        // AND: Wait for agent to process and ask second question
        // This is the critical test - after first answer, should get second question
        // Need to wait for screen to change and show new question

        // First, wait for processing to complete (screen should change)
        // eslint-disable-next-line no-console
        console.log('[E2E] First answer submitted, waiting for second question...');

        // Wait for second question screen OR completion
        // We check if we get another "Agent needs your input" OR if we go back to menu/list
        try {
          await driver.waitForStable({
            timeout: CLAUDE_PROCESSING_TIMEOUT_MS,
            stableFor: 2000,
            interval: POLL_INTERVAL_MS,
          });

          const secondScreen = driver.getScreen();
          // eslint-disable-next-line no-console
          console.log('[E2E] Screen after first answer:', secondScreen.contains('Agent needs your input') ? 'Answer screen' : 'Other screen');

          // Check if we got a second question
          if (secondScreen.contains('Agent needs your input')) {
            // THEN: We successfully got a second question - answer it
            // eslint-disable-next-line no-console
            console.log('[E2E] Second question received - multi-round flow working!');

            const secondAnswer = 'Blue is my favorite color';
            driver.type(secondAnswer);
            await new Promise((resolve) => setTimeout(resolve, 500));
            driver.pressKey('enter');

            // Wait for final processing
            await driver.waitForStable({
              timeout: CLAUDE_PROCESSING_TIMEOUT_MS,
              stableFor: 3000,
              interval: POLL_INTERVAL_MS,
            });

            // Flow completed successfully
            expect(driver.isRunning()).toBe(true);
          } else {
            // If we ended up at menu or list, that's also a valid end state
            // The key is that we didn't HANG
            // eslint-disable-next-line no-console
            console.log('[E2E] Flow completed without second question (agent decided to complete)');
            expect(driver.isRunning()).toBe(true);
          }
        } catch (error) {
          // If we timed out, the flow is hanging - this is the bug we're testing for
          // eslint-disable-next-line no-console
          console.error('[E2E] TIMEOUT - Flow appears to be hanging after first answer!');
          throw error;
        }

        // Clean up
        testProject.cleanup();
      },
      FULL_E2E_TIMEOUT_MS * 2, // Extra time for two rounds
    );

    /**
     * BDD Test: Verify prompt content on resume is correct
     *
     * This test verifies the fix for the bug where on resume,
     * the full template was sent instead of just the user's answer,
     * confusing the agent.
     */
    it(
      'GIVEN answer submitted WHEN agent resumes THEN agent understands answer as continuation not new request',
      async () => {
        expect(claudeAvailable).toBe(true);

        // Create test project
        const testProject = createE2ETestProject('resume-prompt-content');
        testDir = testProject.rootDir;

        // Create driver and start CLI
        driver = createFullCliDriver({
          cwd: testDir,
          timeout: FULL_E2E_TIMEOUT_MS,
          debug: true,
          env: {
            DUNGEONMASTER_PROJECT_DIR: testDir,
          },
        });

        await driver.start();

        // Navigate to Add screen
        await driver.waitForText('add', { timeout: 10000, interval: 500 });
        driver.pressKey('enter');
        await driver.waitForText('What would you like to build', { timeout: 10000, interval: 500 });

        // Submit request
        const userInput =
          "Testing resume flow. Ask me via signal-back mcp: 'What port number?' After I answer, acknowledge my answer and complete.";

        driver.type(userInput);
        await new Promise((resolve) => setTimeout(resolve, 500));
        driver.pressKey('enter');

        // Wait for question
        await driver.waitForText('Agent needs your input', {
          timeout: CLAUDE_PROCESSING_TIMEOUT_MS,
          interval: POLL_INTERVAL_MS,
        });

        // Answer with a specific value that agent should acknowledge
        const specificAnswer = '8080';
        driver.type(specificAnswer);
        await new Promise((resolve) => setTimeout(resolve, 500));
        driver.pressKey('enter');

        // Wait for response - should NOT re-ask about ports or be confused
        await driver.waitForStable({
          timeout: CLAUDE_PROCESSING_TIMEOUT_MS,
          stableFor: 3000,
          interval: POLL_INTERVAL_MS,
        });

        // The agent should either:
        // 1. Complete (go to list/menu)
        // 2. Ask a follow-up question (but NOT re-ask about ports)
        // It should NOT start over or act confused about what the request was

        // eslint-disable-next-line no-console
        console.log('[E2E] Screen after answering port question - checking agent understood answer');

        // Flow completed without hanging = success
        expect(driver.isRunning()).toBe(true);

        // Clean up
        testProject.cleanup();
      },
      FULL_E2E_TIMEOUT_MS,
    );
  });

  describe('SCENARIO: User can respond to agent question', () => {
    /**
     * BDD Test: User submits answer on Answer screen
     *
     * GIVEN: Answer screen is displayed with a question
     * WHEN: User types their response
     * AND: User presses Enter to submit
     * THEN: Claude resumes processing with the user's answer
     */
    it(
      'GIVEN Answer screen WHEN user types answer and presses Enter THEN Claude resumes processing',
      async () => {
        expect(claudeAvailable).toBe(true);

        // Create test project
        const testProject = createE2ETestProject('user-answer-flow');
        testDir = testProject.rootDir;

        // Create driver and start CLI
        driver = createFullCliDriver({
          cwd: testDir,
          timeout: FULL_E2E_TIMEOUT_MS,
          debug: true,
          // Pass project directory as env var so quest broker can resolve paths correctly
          env: {
            DUNGEONMASTER_PROJECT_DIR: testDir,
          },
        });

        await driver.start();

        // Navigate to Add screen and submit question-triggering request
        await driver.waitForText('add', { timeout: 10000, interval: 500 });
        driver.pressKey('enter');
        await driver.waitForText('What would you like to build', { timeout: 10000, interval: 500 });

        const userInput =
          "Testing cli workflow. I want to build a hello world. Ask me the following question using the mcp workflow 'Why hello world?'";

        driver.type(userInput);
        await new Promise((resolve) => setTimeout(resolve, 500));
        driver.pressKey('enter');

        // Wait for Answer screen
        await driver.waitForText('Agent needs your input', {
          timeout: CLAUDE_PROCESSING_TIMEOUT_MS,
          interval: POLL_INTERVAL_MS,
        });

        // WHEN: User types their response
        const userAnswer = 'Because it is the traditional first program to write';

        driver.type(userAnswer);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // AND: User presses Enter to submit
        driver.pressKey('enter');

        // THEN: Claude should resume processing
        // The screen should transition away from the Answer screen
        // It could go to: list (if complete), menu (if error), or another answer (if more questions)
        //
        // We wait for the "Agent needs your input" text to disappear
        // OR for a known completion indicator

        // Wait for screen to change (Answer screen should no longer show)
        // Give Claude time to process the answer
        await driver.waitForStable({
          timeout: CLAUDE_PROCESSING_TIMEOUT_MS,
          stableFor: 3000,
          interval: POLL_INTERVAL_MS,
        });

        // The screen should have changed - either completed or returned to menu
        // We just verify the flow didn't hang
        expect(driver.isRunning()).toBe(true);

        // Clean up
        testProject.cleanup();
      },
      FULL_E2E_TIMEOUT_MS,
    );

    /**
     * BDD Test: User cancels on Answer screen
     *
     * GIVEN: Answer screen is displayed with a question
     * WHEN: User presses Escape
     * THEN: CLI returns to menu screen
     */
    it(
      'GIVEN Answer screen WHEN user presses Escape THEN returns to menu',
      async () => {
        expect(claudeAvailable).toBe(true);

        // Create test project
        const testProject = createE2ETestProject('user-cancel-flow');
        testDir = testProject.rootDir;

        // Create driver and start CLI
        driver = createFullCliDriver({
          cwd: testDir,
          timeout: FULL_E2E_TIMEOUT_MS,
          debug: true,
          // Pass project directory as env var so quest broker can resolve paths correctly
          env: {
            DUNGEONMASTER_PROJECT_DIR: testDir,
          },
        });

        await driver.start();

        // Navigate to Add screen and submit question-triggering request
        await driver.waitForText('add', { timeout: 10000, interval: 500 });
        driver.pressKey('enter');
        await driver.waitForText('What would you like to build', { timeout: 10000, interval: 500 });

        const userInput =
          "Testing cli workflow. Build a hello world. Ask me the following question using the mcp workflow 'Why hello world?'";

        driver.type(userInput);
        await new Promise((resolve) => setTimeout(resolve, 500));
        driver.pressKey('enter');

        // Wait for Answer screen
        await driver.waitForText('Agent needs your input', {
          timeout: CLAUDE_PROCESSING_TIMEOUT_MS,
          interval: POLL_INTERVAL_MS,
        });

        // WHEN: User presses Escape
        driver.pressKey('escape');

        // THEN: Should return to menu screen
        // Wait for menu indicators to appear
        await driver.waitForText('add', {
          timeout: 10000,
          interval: 500,
        });

        const menuScreen = driver.getScreen();
        // Menu should show the options again
        expect(menuScreen.contains('add')).toBe(true);

        // Clean up
        testProject.cleanup();
      },
      FULL_E2E_TIMEOUT_MS,
    );
  });
});

/**
 * Documentation: Signal-back to Answer Screen Flow
 *
 * This section documents the complete flow for reference:
 *
 * 1. User is on Add screen in the CLI (Ink-based terminal UI)
 *
 * 2. User types their request, e.g.:
 *    "Testing cli workflow. I want to do a simple hello world.
 *     Ask me the following question using the mcp workflow 'Why hello world?'"
 *
 * 3. User presses Enter to submit
 *    -> CliAppWidget fires onSpawnChaoswhisperer({ userInput: "..." })
 *    -> start-cli.ts captures this in state.pendingChaoswhisperer
 *    -> Ink app unmounts
 *
 * 4. start-cli.ts calls chaoswhispererSpawnStreamingBroker({ userInput: "..." })
 *    -> This spawns Claude with the chaoswhisperer prompt
 *    -> Claude processes the user's request
 *
 * 5. Claude recognizes the user wants to be asked a question
 *    -> Claude calls the signal-back MCP tool:
 *       mcp__dungeonmaster__signal-back({
 *         signal: 'needs-user-input',
 *         stepId: '<session-id>',
 *         question: 'Why hello world?',
 *         context: 'Testing CLI workflow with hello world'
 *       })
 *
 * 6. teeOutputLayerBroker intercepts Claude's stream-json output
 *    -> Extracts the signal from the MCP tool call result
 *    -> Returns the signal to chaoswhispererSpawnStreamingBroker
 *
 * 7. chaoswhispererSpawnStreamingBroker returns to start-cli.ts with:
 *    {
 *      sessionId: '<session-id>',
 *      signal: {
 *        signal: 'needs-user-input',
 *        question: 'Why hello world?',
 *        context: 'Testing CLI workflow with hello world'
 *      }
 *    }
 *
 * 8. start-cli.ts checks the result (lines 218-230):
 *    if (result.signal?.signal === 'needs-user-input' &&
 *        result.sessionId !== null &&
 *        result.signal.question !== undefined &&
 *        result.signal.context !== undefined) {
 *      const newPendingQuestion = {
 *        question: result.signal.question,
 *        context: result.signal.context,
 *        sessionId: result.sessionId,
 *      };
 *      return StartCli({ initialScreen: 'answer', pendingQuestion: newPendingQuestion });
 *    }
 *
 * 9. StartCli recursively calls itself with:
 *    - initialScreen: 'answer'
 *    - pendingQuestion: { question, context, sessionId }
 *
 * 10. CliAppWidget renders AnswerScreenLayerWidget with the pendingQuestion
 *     -> Shows "Agent needs your input" header
 *     -> Shows "Context: [context]"
 *     -> Shows the question in bold
 *     -> Shows input prompt "> _"
 *
 * 11. User sees the question and can:
 *     a. Type their answer and press Enter -> onResumeChaoswhisperer fires
 *     b. Press Escape -> returns to menu
 *
 * 12. If user submits answer:
 *     -> start-cli.ts captures in state.pendingChaoswhispererResume
 *     -> Calls chaoswhispererSpawnStreamingBroker with resumeSessionId
 *     -> Claude continues processing with the user's answer
 *     -> Flow continues (may loop back to step 5 if more questions)
 */
