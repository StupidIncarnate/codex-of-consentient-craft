/**
 * PURPOSE: The prose `dungeonmaster siegelense docs` serves — the `about` preamble every answer
 * carries, and one document per `siegelenseCallStatics.docs.scopes` entry, each written for one
 * tool-using role. Reach for this over `siegelenseHelpStatics` when you want the RULE a role works
 * by; `--help` is the flag reference (flags, refusals, one example) and answers a different
 * question. Two rules bind every line here. A line naming a capability the tool does not have today
 * ends with `markers.notBuilt` and, where one exists, the callable thing that does the same job.
 *
 * USAGE:
 * docsStatics.scopes.walking.sections;
 * // Returns the walker's sections, the ladder among them
 *
 * docsStatics.markers.notBuilt;
 * // Returns 'NOT BUILT YET' — the token every unavailable capability's line carries
 */

const NOT_BUILT = 'NOT BUILT YET';

export const docsStatics = {
  markers: {
    notBuilt: NOT_BUILT,
  },
  about: [
    'The siegelense tool launches an instance of an application, interacts with it, and returns readings. You run it using: dungeonmaster siegelense <call>. Steps are passed as values within a run batch; they are not standalone commands.',
    'A command only returns measured readings. It does not decide if a test passes or fails. Comparing two values is a reading, but determining if the result means pass or fail is left to the user.',
    `If a line ends with ${NOT_BUILT}, it describes a planned feature that is not implemented yet. Do not try to use it. If a different command can do the same job right now, the instructions will tell you. If a line does not have this marker, the feature is fully built and ready to use.`,
    'You can use the --for flag to show instructions for a specific role. If you omit this flag, you will see the instructions for all seven roles.',
    'Each of the seven scopes corresponds to a specific role that uses this tool. There is no scope for a code-reading role. This is intentional: an agent that only reads code does not need instructions on how to use siegelense to drive a web browser.',
    'These instructions are provided via a command rather than being hardcoded into agent prompts for three reasons. First, any agent can fetch them dynamically. Second, there is only one central source of documentation to maintain. Third, system prompts have character limits; serving the manual dynamically saves valuable prompt space.',
    'Running dungeonmaster siegelense <call> --help provides different information. It shows the specific flags, errors, and an example for that command. This document is the role-specific manual. Use --help to learn how to run a command, and use this document to understand the rules and concepts.',
  ],
  scopes: {
    operating: {
      audience:
        'the operator — the session that opens and closes a pool of instances and assigns tasks to other agents.',
      summary:
        'This scope covers instance and fleet management. As an operator, you do not interact with web pages directly or submit run batches. Therefore, this section does not include any browser-driving commands.',
      sections: [
        {
          heading: 'PRIOR TO OPENING A POOL',
          lines: [
            'Run dungeonmaster siegelense capacity to see how many instances the machine can currently handle. Run this prior to opening a pool.',
            'It returns a suggested pool size, a hard maximum limit, the reasoning behind these numbers, the specific measurements, and the profile group it used for the calculation.',
            'The suggested size is based on actual performance measurements for the given instance spec. If no profile exists yet, it suggests 2 instances, and running those two will generate the initial profile.',
            'The capacity calculation accounts for instances that were started by other sessions. This is an advisory recommendation, but the start command will strictly refuse to run if the machine cannot handle another instance.',
            'You can run dungeonmaster siegelense profile --spec <specName> to see the exact measurements that the capacity command uses. These samples are grouped by pool size. Make sure to check the group that matches the pool size you plan to open.',
          ],
        },
        {
          heading: 'CLEANUP, AT BOTH ENDS OF THE PASS',
          lines: [
            'Run dungeonmaster siegelense cleanup at the beginning and the end of your testing pass.',
            'This command only affects stale instances. It never shuts down an active instance, so it is safe to run at any time, even while a test pass is running.',
            'It removes stale instances, frees up their network ports, removes the registry lock, and deletes old assets based on their age. It uses the exact same safety checks as the prune command, so it will not delete any evidence that is still needed by a verified test or an open issue.',
            'The command output will tell you if any instances were intentionally left alone. This helps you confirm that the cleanup process worked correctly.',
            'By default, the output renders as a readable table. Add the --json flag to get a single JSON object instead.',
          ],
        },
        {
          heading: 'PRUNE ACTS ON ASSETS; CLEANUP ACTS ON INSTANCES',
          lines: [
            'Run dungeonmaster siegelense prune to manually reclaim disk space used by assets, rather than waiting for them to expire automatically. You can filter by --older-than, --instance, or --kind. It will actively refuse to delete protected assets and will provide the specific path that is keeping the asset protected.',
            `Note that open issue records are NOT CHECKED to protect assets. This is because the repository does not store issue records that link to specific instances. The command will list open issues under the unresolved section. ${NOT_BUILT}`,
            'The command refuses to delete protected assets rather than just warning you. If an asset is referenced by a verified test, an open issue, or an active test run, it will not be deleted. The refusal message includes the exact path citing the asset so you can verify it yourself.',
            'If the prune command deleted evidence that someone still needed to read, it would defeat the purpose of keeping evidence in the first place.',
            'If an instance was started without being attached to a specific quest, it has no protections and its assets can be pruned immediately. This is the intended behavior for unowned instances.',
            'Remember: cleanup manages stale instances and cleans up old assets as a side effect. prune manages assets directly and does not affect instances.',
          ],
        },
        {
          heading: 'STATUS — THE POST-MORTEM',
          lines: [
            'Run dungeonmaster siegelense status to see the current state of the machine, all active and dead instances, and the names of the metrics being tracked.',
            'Running status without arguments will not list the individual runs or evidence for an instance. To see those, you must provide a specific instance ID. This prevents unnecessary browsing: operators only need high-level fleet state to manage instances.',
            'Run dungeonmaster siegelense status --instance <id> to see full details for a single instance. This includes its last heartbeat, the last step it executed, its memory usage at that time, any leftover orphan processes, paths to its saved evidence, and a likely cause of failure.',
            'When an instance is cleaned up, its entry becomes a tombstone and remains visible as long as its evidence exists on disk. This allows investigators to check the status of an instance even after it has been shut down.',
            'By default, the fleet status renders as a readable table. Add the --json flag to get the raw JSON document instead.',
          ],
        },
        {
          heading: 'READING WHAT A MINION BRINGS BACK',
          lines: [
            'If an instance dies, it means the current task needs to be retried, but it does not mean the entire testing pass must stop. A tool crash is expected, and starting a new instance will likely succeed.',
            'If a sub-agent reports that its instance crashed, it will provide the instance ID and the status output. The sub-agent must not start a replacement instance, it must not try to clean up orphan processes, and it must not try to rerun the batch of steps.',
            'Do not falsely report a tool crash as a defect in the application itself. This will corrupt the test records.',
            'If an instance dies because it ran out of memory, a replacement instance will likely die the exact same way. If sub-agents automatically replaced their own crashed instances, they would get stuck in a loop of failures.',
            'Only the operator has a full view of the instance pool. A sub-agent only knows about its own instance, while the operator knows the overall machine state. Therefore, only the operator can decide whether to reduce the pool size or stop the testing phase.',
          ],
        },
        {
          heading: 'REAPING RULES',
          lines: [
            'An application instance consists of three processes, two network ports, two open descriptors, a temporary home directory, and various saved state data. A session cannot see if its own instance is leaking resources. Even if a test completes and appears successful, the processes might still be running.',
            'The most common cause of resource leaks is when a session forgets to close its instance, or if the session is terminated early. The only safety net is an idle timeout, which waits 900 seconds prior to automatically shutting down the instance.',
            'If a session crashes in the middle of a test, the instance will leak. The instance is not a direct child process of the session, so it will not shut down automatically when the session crashes.',
            'Closing an instance deletes its temporary home directory, but it never deletes the evidence directory. The logs, screenshots, and test transcripts are kept on disk so they can be reviewed later.',
            'If network ports are not released prior to a new instance starting, two instances might try to use the same port. The cleanup command ensures these ports are properly released.',
          ],
        },
      ],
    },
    planning: {
      audience:
        'the planner — the session that writes the test sequence and proves that the application reaches its starting state.',
      summary:
        'This scope covers test recipes, setup sequences, performance profiles, and machine capacity. You start and stop instances to test your setup sequences, so you will experience the same failures as the test runner.',
      sections: [
        {
          heading: 'WHAT A PRELUDE IS, AND WHAT PROVING ONE MEANS',
          lines: [
            'A prelude is the batch of steps required to reach a specific starting state in the application. You prove a prelude by running it against a real instance and confirming it reaches the correct state.',
            'A proven prelude is marked as VERIFIED. This guarantees that the state can be reliably reproduced. A debugging agent can re-run a VERIFIED prelude exactly as written; otherwise, it would have to guess the correct steps.',
            'Proving a prelude requires using an instance: run dungeonmaster siegelense start, then run, then kill. You must close any instance that you start.',
            'Since you are managing instances, you must follow the same error handling rules as a test runner. If an instance crashes, you must report it back to your dispatcher with the instance ID and the status output. Do not start a replacement, do not clean up orphans, do not retry the batch, and do not report the crash as an application defect.',
          ],
        },
        {
          heading: 'ASK CAPACITY BEFORE YOU OPEN ANYTHING',
          lines: [
            'Run dungeonmaster siegelense capacity to see how many instances the machine can currently handle. Run this before opening a pool, and use the --pool flag to ensure it reads the correct performance profile for your intended pool size.',
            'You are not the only session using this machine. The capacity command accounts for instances started by other sessions. The start command will completely refuse to run if the machine is full.',
          ],
        },
        {
          heading: 'PROFILE — WHAT ONE INSTANCE OF A SPEC COSTS',
          lines: [
            'Run dungeonmaster siegelense profile --spec <specName> to view performance data. It shows the number of processes, the application version hash, the measurement timestamp, the number of test runs used, the boot time, and performance samples grouped by pool size.',
            'This command only reads existing measurements; it does not measure performance on demand. If an application has not been tested yet, it will return empty samples and a null boot time rather than starting an instance to check.',
            'Performance samples are grouped by pool size and are never averaged together. Running a single instance is much faster than running many at once, so always look at the measurements that match your intended pool size.',
            'A profile is tied to the exact application version. If the application adds a new background service, the performance will be re-measured automatically. Headless applications measure their performance the same way, and the machine can usually run more of them at once.',
          ],
        },
        {
          heading: 'RECIPES — WHAT STATES CAN BE CREATED',
          lines: [
            'Run dungeonmaster siegelense recipes to list all available setup recipes. The output shows what state each recipe creates, its reliability, and what parameters it requires. This command does not start any instances or use any machine capacity.',
            'If the list is empty, it means no recipes have been created yet. If the recipes package is missing entirely, the command will return an error instead.',
            'The seed step runs a recipe as part of a test batch and returns the IDs of any data it created, such as { step: "seed", recipe: "<name>", as: "g" }. Later steps can use these IDs, like {g.guildSlug}. Using start --seed <name> does the same thing when booting the instance and saves the IDs in the manifest.',
            'A recipe requires specific parameters to run. You must provide these parameters directly in the step, like { step: "seed", recipe: "session-with-nested-subagent", guild: "{g.guildId}", as: "s" }. You can chain recipes together by using the IDs from one recipe as parameters for the next.',
            "Recipes directly modify the application state; they do not click on the screen. If a recipe tries to interact with the web browser, it is doing the test runner's job.",
          ],
        },
        {
          heading: 'NAME WHAT THE PRELUDE CARRIES: TESTIDS, NEVER REFS',
          lines: [
            'If you need to save a test sequence, re-run it later, or give it to another agent, you must identify elements using a testId and a within scope. A ref is a temporary ID that is only valid for a single page view on a single instance.',
            'You might think you can pass a ref between different agents or test phases, but this will always fail.',
            'This failure is hard to detect. If you use a stale ref like 14, the tool will not show an error because ref 14 might accidentally point to a completely different element on the new page. The test will run, but it will click the wrong thing.',
            'Therefore, any saved test sequence must use testIds and scopes, never refs. A testId and scope will accurately find the same element across any number of instances or test runs.',
          ],
        },
        {
          heading: 'WHAT A PLAN CAN PROMISE TODAY',
          lines: [
            `There are twenty-three available step verbs: goto, waitFor, click, type, screenshot, eval, look, box, seed, until, dom, key, health, resize, request, before, file, storage, paste, hold, video, snapshot, and reset. Any other verb you see in the design is ${NOT_BUILT}.`,
            'The look command returns a list of every interactable element on the screen. This allows you to discover the correct testId to use, rather than having to know it in advance.',
            'The seed command runs a setup recipe to prepare the application state. Run dungeonmaster siegelense recipes to see what recipes are available. You can run a recipe using { step: "seed" } and then use its generated IDs in your test steps.',
          ],
        },
      ],
    },
    walking: {
      audience:
        'the walker — the session driving a browser against one instance and recording what it reads.',
      summary:
        'This scope covers the available actions, the rules for reading the screen, and the sequence of tools to use. Read the first section carefully before planning any actions: the look command is how you discover what is currently visible on the screen.',
      sections: [
        {
          heading: 'READ THIS FIRST',
          lines: [
            'The look command returns a structured list of every interactable element on the page. Each element has a temporary ref ID that you can use to interact with it. It tells you exactly what is on the screen and how to target specific elements. Always run look before trying to click anything.',
            'Each row in the look output provides the ref ID, the testId, the HTML tag, the accessibility role, the DOM ID, and an index if multiple siblings share the same name. It also shows the text content or input value, any important HTML attributes, and the current state flags of the element.',
            'State flags tell you important information without you having to ask. Examples include disabled, focused, invisible-opacity-0, and offscreen. Always check these flags; if a button is flagged as disabled, clicking it will do nothing.',
            'At the bottom of the output, there may be two additional warnings. A duplicate warning means the same testId is used in two different places, which is a bug in the application. A truncation warning tells you if the tool had to limit the output because there were too many elements.',
            'The look command only reads text that directly belongs to the element itself, not text inside its children. If an element shows no text, it might just be a container for other elements that do have text.',
          ],
        },
        {
          heading: 'THE LADDER',
          lines: [
            'Always try to use the look command first. Only use the dom command as a last resort, and always target it as narrowly as possible.',
            'Rung 1, look — the default tool. It tells you what elements exist, what they are called, and if they have any errors. It is efficient and fully built.',
            'Rung 2, look { within } — the same command, but restricted to a specific section of the page. Use this when the page is too crowded or has a very long list of items. It is faster and fully built. The within parameter accepts a simple testId or a full CSS selector like [data-testid="..."]',
            'Rung 3, box { ref } — provides the exact physical dimensions and position of a single element on the screen. Fully built.',
            'Rung 4, dom { target } — the escape hatch. Use this only when you need to answer a specific question that the look command cannot answer. It can be very slow and resource-intensive if used carelessly. Fully built.',
            'Rung 5, eval — runs custom JavaScript on the page. This is a different kind of escape hatch. It is fast, but it risks breaking the rules by calculating test results inside the browser instead of returning raw data.',
          ],
        },
        {
          heading: 'THE HATCH, AND ITS GUARDS',
          lines: [
            'The dom command is necessary because the look command cannot possibly include every single HTML attribute or handle every edge case.',
            'However, the dom command must be your last resort. If you run dom against the entire page body, it might return massive amounts of text and styles, which is slow and unreadable. This is why the look command is designed to be efficient by default.',
            'You should use the dom command when you need to check an attribute that look does not show, when you need the exact un-truncated text of an element, when you just need to count how many items exist, or when you need to investigate why an element looks strange on screen.',
            'The dom command has three built-in safety features. First, it only reads direct text nodes by default unless you explicitly ask for full textContent. Second, you must specify which fields you want to read. Third, it has a maximum limit on how many items it will return, but it will tell you the true total count so you know if items were skipped.',
            'If you use the eval command, always use querySelectorAll and count the results. Never use querySelector, because it silently returns only the first match and ignores the rest.',
          ],
        },
        {
          heading: 'THE READING RULES: NOTHING EVER SILENTLY PICKS A MATCH',
          lines: [
            'When you target an element, there are only three possible outcomes. If exactly one element matches, the action succeeds. If more than one matches, it throws an ERROR. If zero match, it throws an ERROR. The tool will never just guess and click the first match.',
            'If the target is AMBIGUOUS, the error message will list all the matching elements and suggest how you can use a within scope to narrow down your target.',
            'If there is NO MATCH, the error message will suggest similar testIds. This helps you quickly recover if you made a typo.',
            'Sometimes, two identical elements share the same within scope, making them impossible to tell apart by name. In this case, each candidate in the error message will provide a unique ref ID. You can then use that ref ID to perform the action, like { "step": "click", "ref": N }.',
          ],
        },
        {
          heading: 'REFS ARE FOR DRIVING, SELECTORS ARE FOR RECORDING',
          lines: [
            'A testId and a within scope are permanent. You should use them whenever you are saving a test, writing a guide, or passing instructions to another agent.',
            'A ref ID is temporary. It is only valid for the current page view on the current instance. It is meant to be used immediately during a live session.',
            'Do not rely on the exact screen position or the index number of an element, as these change easily and are not reliable.',
            'Never save a ref ID into a test script, a bug report, or a setup recipe. Never pass a ref ID to another agent.',
            'A ref ID points to a specific HTML element in memory. If you navigate to a new page, refresh the browser, or restart the instance, every ref ID becomes invalid immediately. If you try to use an invalid ref ID, the tool will report an unknown error.',
            'When performing an action like clicking or typing, you must provide either a target selector or a ref ID. You cannot provide both, and you cannot provide neither.',
          ],
        },
        {
          heading: 'THE VERBS YOU CAN SUBMIT TODAY',
          lines: [
            'There are ten available actions. You submit them as a list of steps in a run batch, not as individual commands:',
            `{ step: 'goto', path: '/siege-1/session/sess-nested' }`,
            `{ step: 'look' } or { step: 'look', within: 'SUBAGENT_CHAIN' }`,
            `{ step: 'box', ref: 26 }`,
            `{ step: 'dom', target: '[data-testid="subagent-chain-duration"]', fields: ['text', 'rect'] }`,
            `{ step: 'waitFor', target: '[data-testid="SUBAGENT_CHAIN"]', state: 'visible' }`,
            `{ step: 'click', target: '[data-testid="EXECUTION_ROW_0"]' } or { step: 'click', ref: 26 }`,
            `{ step: 'type', target: '[data-testid="CHAT_INPUT"]', value: 'guild-alpha' } or { step: 'type', ref: 14, value: 'guild-alpha' }`,
            `{ step: 'key', press: 'Enter' }`,
            `{ step: 'screenshot', name: 'after-create.png' }`,
            `{ step: 'eval', source: 'document.querySelectorAll("[data-testid=QUEST_ROW]").length' }`,
            'When taking a screenshot, you must include a file extension in the name, like .png. Otherwise, the tool will throw an error.',
            'The goto, click, type, and key commands automatically take a screenshot for you. The look command also takes a screenshot. Every screenshot automatically calculates how many pixels changed on the screen.',
            'All ten of these actions require a web browser. If you try to run them on a headless server instance, they will immediately fail with a clear error message.',
            'The until command waits for something other than a basic element state. It has five forms: { step: "until", visible: "[data-testid=\\"SUBAGENT_CHAIN\\"]", timeoutMs: 20000 }, { step: "until", predicate: "document.querySelectorAll(\\"[data-testid=QUEST_ROW]\\").length === 3" }, { step: "until", console: "hydrated" }, { step: "until", response: { method: "POST", path: "/api/quests" } }, or { step: "until", file: "guilds/<id>/quests/<id>/quest.json" }.',
            "You must provide exactly one condition for the until command. Four of these conditions require a web browser. The file condition checks the server's disk, so it can be used on both browser and headless instances. Use the file condition when you need to wait for the application to save data.",
            'The console and response conditions only monitor the current test run. If you are waiting for a network request, it must be triggered by a step in the same batch. It will not detect requests that happened in previous test runs.',
          ],
        },
        {
          heading: 'WHAT A BATCH RETURNS, AND WHERE THE PAYLOADS ARE',
          lines: [
            'The run command returns a basic status summary, which includes the step index and a list of screenshots. It does not return the detailed data for each step. This is to avoid hitting the character limit for agent prompts.',
            'To read the detailed data from a specific step, use dungeonmaster siegelense results --instance <id> --run <runId> --step <n>.',
            'There are six types of evidence you can read: console, network, ws, server, screenshots, and steps. The steps output provides a full transcript of everything that happened during the run.',
            'Every log entry and network request automatically includes the step number it happened during. You do not have to guess which step caused an error.',
            'If you click a button and the tool reports zero network requests, that is a valuable finding. It proves the button did nothing.',
            'You can filter the results using --where-path, --where-method, --where-level, and --where-steps. You can also limit the output data using --fields. Filtering the data helps you avoid reading massive log files.',
          ],
        },
        {
          heading: 'STOPON AND EXPECT',
          lines: [
            'By default, a test batch stops immediately if any step fails. You can override this by passing --stop-on never.',
            'If you use --stop-on never, the test will continue running even after a failure. In this case, the stoppedAt value will tell you where the test WOULD have stopped if it had been allowed to.',
            'If you expect a specific step to fail, add expect: error to that step. If a step is marked with expect: error but it actually succeeds, the test will stop and report an error. The application accepting an action it should have refused is a bug.',
          ],
        },
        {
          heading: 'WHEN YOUR INSTANCE DIES UNDER YOU',
          lines: [
            'If your instance crashes, report it to the agent that assigned you the task. Do not try to fix it yourself.',
            'Do not start a replacement instance. If the instance crashed due to high memory usage, the new instance will probably crash exactly the same way.',
            "Do not try to clean up leftover processes. You cannot be sure which processes belong to you, and you might accidentally break another agent's test.",
            'Do not retry the test batch. Running the same test under the same conditions will just cause another crash.',
            'Never report an instance crash as a bug in the application itself. This makes the test results inaccurate.',
            'A dead instance just means you need to try again, it does not mean the entire test is blocked. Send the instance ID and the status output back to the operator. Only the operator can see the full machine status and decide what to do.',
          ],
        },
      ],
    },
    attacking: {
      audience:
        'the stress tester — the session running attacks against one instance and measuring what breaks.',
      summary:
        'This scope covers the health check, the three reset levels, how to expect errors, and how to use baselines. Read the first section carefully: the features that automatically reset the instance to a clean state are not built yet.',
      sections: [
        {
          heading: 'READ THIS FIRST',
          lines: [
            'The reset and snapshot commands are BUILT. The health command is BUILT.',
            'If an attack changes the application state, you must start a fresh instance for it: boot the instance, run the attack, read the results, and close the instance. If you run a second attack on the same instance, you will be testing the damaged state left by the first attack.',
            'The rules below explain how the application state works. These rules are true regardless of whether the automated reset commands are fully built yet.',
          ],
        },
        {
          heading: 'HEALTH — ONE READING, ONE VERDICT LINE',
          lines: [
            "The health command takes a standardized reading of the application state so you can compare before and after. It is the stress tester's version of the look command.",
            'It returns one of three statuses. HEALTHY means the page loaded, the console is clean, there are no server errors, and the server log is clean. DEGRADED means the page loaded but there is a console error. DOWN means the page did not load, the screen is blank, or there are multiple server errors.',
            'The tool intentionally reports a blank screen in both the health command and the screenshot data.',
            'You can perform this exact health check manually using existing commands: check results --kind console for browser errors, results --kind network for failed requests, results --kind server --where-steps a-b --where-level error for server logs, and check the blank status on your screenshots.',
            'Server logs are critical. If a background process fails, it might not show up in the browser console. Checking the server log is the only way to catch these hidden errors.',
          ],
        },
        {
          heading: 'STATE LIVES IN THREE PLACES AND NO SINGLE ACTION CLEARS ALL THREE',
          lines: [
            'The disk stores the temporary home directory, logs, and saved data. This can be cleared by restoring a snapshot.',
            'The server memory stores the active API process, background watchers, and caches. This can ONLY be cleared by fully restarting the server.',
            'The browser stores local data, session data, active connections, and the current web page. This can be cleared by opening a fresh browser context or manually clearing the storage.',
            'Server memory is the most dangerous place for state to hide. For example, if you send a message, it is saved to disk but also cached in memory. If you only restore the disk snapshot, the server memory will still contain the message from your attack.',
            'If you only clear the disk and assume the application is completely clean, your subsequent tests will produce incorrect results.',
          ],
        },
        {
          heading: 'THE THREE RESET LEVELS',
          lines: [
            `The page level clears browser storage and reloads the document, but it keeps the disk and server memory. This takes about one second. ${NOT_BUILT}.`,
            `The state level clears the disk and the browser, but it KEEPS SERVER MEMORY. This takes about two seconds. ${NOT_BUILT}.`,
            'The instance level clears everything by starting a completely new process. This takes about twenty seconds. Right now, you can only do this manually by closing the current instance and starting a new one.',
            'When using the state reset level, you must specify the exact name of the snapshot you want to restore. If you pick the wrong snapshot, all your following tests will be testing the wrong starting state.',
            'A snapshot only backs up the application data. Logs, screenshots, and test transcripts are completely separate and will survive any reset. Test evidence always accumulates safely.',
            'When you reset the state, the tool reports exactly what files were changed. This proves that the reset worked and acts as a damage check to ensure no corrupted files were left behind.',
            'You must declare which reset level your attack requires. Most attacks only need the state level. If your attack targets the server itself, like exhausting memory or breaking connections, you must use the instance level.',
            'The instance level has two limitations. First, it ruins any tests that measure long-running metrics like server uptime. Second, it only provides a consistent starting point if the setup recipe is perfectly deterministic.',
          ],
        },
        {
          heading: 'EXPECT: ERROR',
          lines: [
            'If you expect a specific test step to fail, add expect: error to that step. This only applies to that single step; if any other step fails, the test will still stop.',
            'If a step is marked with expect: error but it actually succeeds, the test will stop and report an error. The application accepting an action it should have refused is a bug.',
            'If you do not include expect: error, the tool assumes the step should succeed. Any unexpected failure will stop the test batch.',
          ],
        },
        {
          heading: 'BASELINES',
          lines: [
            'You do not create your own baselines. You inherit them from the successful test run that proved the starting state. You can read these baseline screenshots using results --instance <id> --run <runId> --kind screenshots. This works even if the original instance was closed hours ago.',
            'Comparing your attack results against an already-broken baseline is dangerous. If the baseline was broken, your attack might show no difference, and you will incorrectly report that the application survived the attack.',
            'A screenshot is only approved as a baseline if every test on that screen passed AND there were no previous errors in the test run. If an error happened earlier, the screen might look correct but the application state is actually corrupted.',
            `The system that automatically approves baselines is ${NOT_BUILT}. You will receive the instance ID and run ID, but you must manually verify that the baseline is valid.`,
            'When testing an error path, the correct result is usually an error message on the screen. If you compare an error path against a happy-path baseline, you will falsely report the error message as a visual bug. Or worse, if the application fails to show the error message, the screens will match and you will incorrectly report the test as successful.',
            'Error messages are often temporary popups. You should verify they exist by checking the screen text, not by comparing pixel differences.',
            'Pixel-perfect comparisons are reliable across different test runs. The application uses a fixed random seed, so the screen will look exactly the same every time.',
          ],
        },
        {
          heading: 'SERVER-SIDE FAILURE INJECTION',
          lines: [
            'You can test many types of bad input directly through the web browser, like typing garbage text, entering huge values, or clicking rapidly.',
            `However, you cannot easily test server-side failures through the browser, such as server crashes, hanging requests, or dropped connections. Automated tools to simulate server-side failures are ${NOT_BUILT}.`,
            'The testing environment currently only fakes the agent CLI and the ward binary. It does not fake any other background systems.',
            `The look command is designed to help you find important HTML attributes like maxlength and pattern, as well as live regions where error messages appear. However, automatically checking these attributes during an attack is ${NOT_BUILT}.`,
          ],
        },
      ],
    },
    fixing: {
      audience:
        'the fixer — the session that arrives after the walk is over and the instance is gone.',
      summary:
        'This scope explains how to read the results of a finished test, how to re-run the setup sequence, and how to properly close the instances you use. The first four data queries do not require a running instance.',
      sections: [
        {
          heading: 'WHAT YOU WERE HANDED, AND WHAT THE FIRST FOUR READS COST',
          lines: [
            'You will receive a test record containing the instance ID, the run ID, the step that failed, the setup sequence, and paths to the saved evidence.',
            'Steps 1 through 4 below do not require a running instance. They only read files from disk. They are completely free and work perfectly even if the instance was shut down hours ago. You only need to start a new instance for Step 5, when you actually reproduce the bug.',
            'Every data query will report the instance status as alive, killed, dead, pruned, or unknown.',
            'The statuses pruned and unknown are actual results, not just empty data. If you query an old test and receive an empty list, you might incorrectly assume the test did nothing. If you make a typo in the ID, the tool will return unknown, letting you know you made a mistake.',
          ],
        },
        {
          heading: 'STEP 1 — WAS THIS A CLEAN END OR A CRASH',
          lines: [
            'Run dungeonmaster siegelense status --instance <id> to check the instance status.',
            'This tells you if the evidence is complete. A killed status means the test finished normally and all evidence was saved. A dead status means the testing tool itself crashed, so any steps after the crash will have missing evidence.',
            'The status command can provide this information because cleaned-up instances leave behind a tombstone record. As long as the evidence files exist on disk, the tool can tell you exactly what happened to the instance.',
          ],
        },
        {
          heading: 'STEP 2 — WHAT DID THE FAILING STEP ACTUALLY READ',
          lines: [
            'Run dungeonmaster siegelense results --instance <id> --run <runId> --step <n> to see the exact data from the failing step.',
            'You must specify the run ID. A single instance might contain multiple different test runs, and if the tool just picked the latest one, you might look at the wrong data.',
            'If you run this command without specifying a step or a kind, you will receive the high-level summary of the entire run, which includes the list of screenshots and where the test stopped.',
            'The tool provides absolute file paths to the screenshots. You can open these paths directly to view the images.',
          ],
        },
        {
          heading: 'STEP 3 — WHAT DID THE SERVER SAY WHILE IT HAPPENED',
          lines: [
            'Run dungeonmaster siegelense results --instance <id> --run <runId> --kind server --where-steps 6-8 --where-level error to check the server logs.',
            'This provides information that cannot be seen anywhere else. Browser consoles do not show server-side exceptions. Checking the server log is often the only way to find the root cause of a failure.',
          ],
        },
        {
          heading: 'STEP 4 — CONFIRM IT ON THE WIRE, SCOPED TO ONE STEP',
          lines: [
            'Run dungeonmaster siegelense results --instance <id> --run <runId> --step <n> --kind network --fields status,responseBody to check the network requests.',
            'Every network request is tagged with the exact step number it occurred during. This allows you to pinpoint exactly which API call failed without having to guess.',
          ],
        },
        {
          heading: 'STEP 5 — REPRODUCE ON A FRESH INSTANCE',
          lines: [
            'Run dungeonmaster siegelense start --spec <specName>, then run dungeonmaster siegelense run --instance <newId> --steps <the prelude, verbatim>.',
            'Never try to restart or reuse the original instance that failed.',
            'The setup sequence you received is marked as VERIFIED. This means it is guaranteed to reach the correct starting state. You are reliably reproducing the bug, not just guessing how to trigger it.',
            'An instance will automatically shut down after 900 seconds of inactivity. Reading files from disk does not reset this timer. If you need more time to investigate, use the --idle-timeout-ms flag when starting the instance.',
          ],
        },
        {
          heading: 'STEP 6 — WRITE THE E2E WITH THE SAME RECIPES THE PRELUDE NAMED',
          lines: [
            'When you write the final automated test, use the exact same setup recipes that the original test used.',
            'The seed command uses the same backend code as the automated tests, ensuring that the manual test and the automated regression test use the exact same starting state.',
          ],
        },
        {
          heading: 'STEP 7 — CLOSE WHAT YOU OPENED',
          lines: [
            'Run dungeonmaster siegelense kill --instance <newId> to shut down the instance. You are responsible for closing any instance you start.',
            'This will stop the processes, free up the network ports, and delete the temporary files, but it will safely preserve the evidence directory for future review.',
          ],
        },
        {
          heading: 'WHAT A FIXER MUST NOT DO, AND THE MISTAKE IT MAKES IN THE CAUTIOUS DIRECTION',
          lines: [
            'Do not try to resurrect the dead instance. Do not start a new instance just to browse around. Do not look for evidence belonging to an instance you were not assigned.',
            'Every running instance consumes machine resources. Starting unnecessary instances will block other testing agents from doing their work.',
            'However, this rule only applies to running processes. Steps 1 through 4 only read files from disk and consume no resources. The most common mistake is assuming you need to start a new instance just to read the logs from the previous failure. Doing so wastes machine capacity and gives you logs for the wrong instance.',
          ],
        },
      ],
    },
    driving: {
      audience:
        'a session nobody orchestrated — no quest dispatched you, and no dispatcher is watching.',
      summary:
        'This scope provides the same instructions as the other roles, but addressed directly to you. You are responsible for managing your own instances and tasks.',
      sections: [
        {
          heading: 'FIVE THINGS TRUE OF YOU AND OF NO DISPATCHED ROLE',
          lines: [
            'You are sharing this machine with other agents. Run capacity before starting anything. The start command will queue your request if the machine is busy, so starting multiple instances will slow down other tests.',
            'You must call kill yourself. Since no operator is managing you, your instance will stay alive and leak resources until the idle timeout hits, or until another agent runs the cleanup command.',
            'The start command provides the paths to your instance evidence. You must save these paths yourself. There is no command to look them up later, so write them down immediately.',
            'Your instance is marked as unowned, which means its assets are not protected. They will be automatically deleted when they get old.',
            'The cleanup command is completely safe to run. It only removes stale instances and will not interfere with active tests. Run it regularly to prevent orphan processes from building up.',
          ],
        },
        {
          heading: 'THE SURFACE, IN THE ORDER YOU WILL WANT IT',
          lines: [
            'Run dungeonmaster siegelense capacity to see how many instances the machine can currently handle. You are sharing this machine, so always check this first. The start command will refuse to run if the machine is full.',
            'Run dungeonmaster siegelense start --spec dungeonmaster-stack to boot a new instance. The command waits until the instance is ready, then returns the manifest. The manifest includes the instance ID, URL, file paths, and boot times.',
            'Run dungeonmaster siegelense start --spec dungeonmaster-api to boot an instance without a web browser, for testing background processes.',
            'Run dungeonmaster siegelense start --idle-timeout-ms <ms> to increase the idle timeout for your instance. Instances normally shut down after 900 seconds of inactivity. If you are testing manually, you should increase this timeout so the instance does not die while you are thinking. This only raises the limit; the timeout is necessary to prevent abandoned instances from running forever.',
            `Run dungeonmaster siegelense run --instance <id> --steps '[{"step":"goto","path":"/"}]' to submit a batch of test steps. This returns a basic status summary, not the detailed test data. You can also load steps from a file using --steps-file <path>.`,
            'Run dungeonmaster siegelense results --instance <id> --run <runId> [--step <n>] [--kind <kind>] to read the detailed test data from disk. This command does not start any instances and works even after the instance is shut down.',
            'Run dungeonmaster siegelense status --instance <id> to see the full details of your instance, including why it crashed if it failed.',
            'Run dungeonmaster siegelense kill --instance <id> to shut down your instance, free up network ports, and remove temporary files. The test evidence will be saved.',
          ],
        },
      ],
    },
    operational: {
      audience:
        'a session verifying a flow that has no screen, where siege is the only verification track there is.',
      summary:
        'This scope covers the headless browser lane, reading server logs, and the specific test steps available for headless flows. You use request and file to drive the flow, and until { file } to wait for background tasks.',
      sections: [
        {
          heading: 'WHAT THIS SCOPE IS',
          lines: [
            'An operational flow has no web interface, so the standard browser-driving commands do not apply. The siege tool is the only way to verify these background processes.',
            'Background processes can still be attacked and tested for performance. Since you cannot click or type, you interact with the process by sending direct network requests and reading files.',
          ],
        },
        {
          heading: 'THE BROWSERLESS LANE SPEC',
          lines: [
            'Run dungeonmaster siegelense start --spec dungeonmaster-api to start an instance without Chromium. A headless spec is treated exactly the same as a normal spec.',
            'The capacity command automatically handles headless specs. Since they use fewer resources, the machine can typically run more of them at the same time.',
            'If you accidentally send a browser command to a headless instance, it will fail immediately with a clear error message. It will not silently ignore the command. The following browser commands will explicitly fail on a headless instance: goto, waitFor, click, type, screenshot, eval, look, box, dom, key, health, and resize.',
            'A headless instance still boots the fake agent CLI, because it needs to run the background processes that manage agents and tests.',
            `The default application configurations still assume a web interface exists. ${NOT_BUILT}`,
          ],
        },
        {
          heading: 'THE STEPS A FLOW WITH NO SCREEN USES',
          lines: [
            'Use { step: "request", method: "POST", path: "/api/guilds", body: { name: "x", path: "/tmp/x" } } to send direct HTTP requests. This is fully built.',
            'Use { step: "file", path: "guilds/<id>/quests/<id>/quest.json" } to read a file generated by the background process. This is fully built.',
            'Use { step: "until", file: "guilds/<id>/quests/<id>/quest.json", timeoutMs: 10000 } to wait for a specific file to be created or updated. This is fully built. It is the only wait condition you can use on a headless instance.',
            'You cannot use { step: "until", response: { method: "POST", path: "/api/quests" } } on a headless instance because it requires a browser to monitor the network traffic.',
            'The { step: "storage", prefix: "dm-" } command is for browser storage. Since a headless instance has no browser, you must use the file command instead to read saved data. This is fully built.',
          ],
        },
        {
          heading: 'RESULTS KIND SERVER — THE READING NOTHING ELSE SURFACES',
          lines: [
            'Run dungeonmaster siegelense results --instance <id> --run <runId> --kind server [--where-level error] [--where-steps 4-9] to read the server logs. This is fully built.',
            'The instance saves the server logs in its own directory, but the tool does not automatically broadcast their location.',
            'Since there is no web browser, the standard console logs will be empty. The server log contains all the important information.',
            'Every server log entry is tagged with the step number it occurred during. This allows you to easily find logs for a specific part of your test.',
            'The standard network logs are also browser-only and will be empty. The server log is the only way to see network activity on a headless instance.',
          ],
        },
        {
          heading: 'WHAT IS MISSING BEFORE THIS SCOPE IS USABLE',
          lines: [
            'The request, file, and storage commands are fully built. The until { file } command is built and is the only until form allowed on a headless instance. All other until forms (visible, predicate, console, response) will fail with an error. Right now, you can boot a headless instance, shut it down, read its server logs, and test it using request, file, and until { file }.',
            'You can now fully test headless flows using the request and file commands. Any browser-specific commands or storage checks will explicitly fail.',
          ],
        },
      ],
    },
  },
} as const;
