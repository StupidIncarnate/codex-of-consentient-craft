/**
 * PURPOSE: The prose `dungeonmaster siegelense docs` serves — the `about` preamble the bare call
 * carries, and one document per `siegelenseCallStatics.docs.scopes` entry, each written for one
 * tool-using role. Reach for this over `siegelenseHelpStatics` when you want the RULE a role works
 * by; `--help` is the flag reference (flags, refusals, one example) and answers a different
 * question. A role page (`docs --for <scope>`) is written to stand alone: the reader is the prompt
 * that sent them here, then this one page, and nothing else — so a fact a role's prompt requires
 * lives on that role's own page rather than on a sibling's.
 *
 * USAGE:
 * docsStatics.scopes.walking.sections;
 * // Returns the walker's sections, the ladder among them
 */

import { stepStatics } from '../step/step-statics';

export const docsStatics = {
  about: [
    'Run dungeonmaster siegelense docs with no --for flag to see this overview alone. Add --for <scope> to fetch the manual for one role instead.',
    'The siegelense tool launches an instance of an application, interacts with it, and returns readings. You run it using: dungeonmaster siegelense <call>. Steps are passed as values within a run batch; they are not standalone commands.',
    'A command only returns measured readings. It does not decide if a test passes or fails. Comparing two values is a reading, but determining if the result means pass or fail is left to the user.',
    'You can use the --for flag to show instructions for a specific role. If you omit this flag, you will see this overview alone, with no per-role instructions.',
    'Each of the four scopes corresponds to a specific role that uses this tool. There is no scope for a code-reading role. This is intentional: an agent that only reads code does not need instructions on how to use siegelense to drive a web browser.',
    'These instructions are provided via a command rather than being hardcoded into agent prompts for three reasons. First, any agent can fetch them dynamically. Second, there is only one central source of documentation to maintain. Third, system prompts have character limits; serving the manual dynamically saves valuable prompt space.',
    'Running dungeonmaster siegelense <call> --help provides different information. It shows the specific flags, errors, and an example for that command. This document is the role-specific manual. Use --help to learn how to run a command, and use this document to understand the rules and concepts.',
  ],
  scopes: {
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
            'Rung 1, look — the default tool. It tells you what elements exist, what they are called, and if they have any errors. It is efficient.',
            'Rung 2, look { within } — the same command, but restricted to a specific section of the page. Use this when the page is too crowded or has a very long list of items. It is faster. The within parameter accepts a simple testId or a full CSS selector like [data-testid="..."]',
            'Rung 3, box { ref } — provides the exact physical dimensions and position of a single element on the screen.',
            'Rung 4, dom { target } — the escape hatch. Use this only when you need to answer a specific question that the look command cannot answer. It can be very slow and resource-intensive if used carelessly.',
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
            'Sometimes, two identical elements share the same within scope, making them impossible to tell apart by name. In this case, each candidate in the error message will provide a unique ref ID. You can then use that ref ID to perform the action, like { "step": "click", "ref": 14 }.',
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
          heading: 'AVAILABLE STEP VERBS',
          lines: [
            `The step contract accepts ${stepStatics.verbs.all.length} step verbs: ${stepStatics.verbs.all.join(', ')}. You submit them as a list of steps in a run batch, not as individual commands. This page shows a worked example for the verbs a walker reaches for most; every other verb works exactly as its name suggests.`,
            '{ "step": "goto", "path": "/siege-1/session/sess-nested" }',
            '{ "step": "look" }',
            '{ "step": "look", "within": "SUBAGENT_CHAIN" }',
            '{ "step": "box", "ref": 26 }',
            '{ "step": "dom", "target": "[data-testid=\\"subagent-chain-duration\\"]", "fields": ["text", "rect"] }',
            '{ "step": "waitFor", "target": "[data-testid=\\"SUBAGENT_CHAIN\\"]", "state": "visible" }',
            '{ "step": "click", "target": "[data-testid=\\"EXECUTION_ROW_0\\"]" }',
            '{ "step": "click", "ref": 26 }',
            '{ "step": "type", "target": "[data-testid=\\"CHAT_INPUT\\"]", "value": "guild-alpha" }',
            '{ "step": "key", "press": "Enter" }',
            '{ "step": "screenshot", "name": "after-create.png" }',
            '{ "step": "eval", "source": "document.querySelectorAll(\\"[data-testid=QUEST_ROW]\\").length" }',
            'When taking a screenshot, you must include a file extension in the name, like .png. Otherwise, the tool will throw an error.',
            'The goto, click, type, and key commands automatically take a screenshot for you. The look command also takes a screenshot. Every screenshot automatically calculates how many pixels changed on the screen.',
            "Most of these verbs need a web browser — run one against a headless server instance and it fails immediately with a clear error message. The seed, request, file, snapshot and reset verbs, and until's file condition, read disk or an API directly and work on either kind of instance.",
            'The until command waits for something other than a basic element state. It takes exactly one of five conditions:',
            '{ "step": "until", "visible": "[data-testid=\\"SUBAGENT_CHAIN\\"]", "timeoutMs": 20000 }',
            '{ "step": "until", "predicate": "document.querySelectorAll(\\"[data-testid=QUEST_ROW]\\").length === 3" }',
            '{ "step": "until", "console": "hydrated" }',
            '{ "step": "until", "response": { "method": "POST", "path": "/api/quests" }, "timeoutMs": 15000 }',
            '{ "step": "until", "file": "guilds/<id>/quests/<id>/quest.json", "timeoutMs": 10000 }',
            "You must provide exactly one condition for the until command. Four of these conditions require a web browser. The file condition checks the server's disk, so it can be used on both browser and headless instances. Use the file condition when you need to wait for the application to save data.",
            'The console and response conditions only monitor the current test run. If you are waiting for a network request, it must be triggered by a step in the same batch. It will not detect requests that happened in previous test runs.',
            'The seed command runs a setup recipe to prepare the application state. Run dungeonmaster siegelense recipes to see what recipes are available.',
            'A recipe takes no input directly on the step: any parameter it declares goes inside a "params" object instead, because a recipe input named "as", "step", or "recipe" would otherwise collide with the step\'s own fields.',
            'Bind the recipe\'s output to a name with "as", then read a bound value back with a three-segment reference: {step.row.field} — the step name you gave it, the row the recipe saved under that step, and the field on that row. Seed one recipe per step; steps in the same batch can feed each other:',
            '{ "step": "seed", "recipe": "guild-empty", "as": "g" }',
            '{ "step": "seed", "recipe": "session-with-nested-subagent", "params": { "guild": "{g.guild.id}" }, "as": "s" }',
            'guild-empty above binds a row named guild, carrying the fields id, name, path, urlSlug, and createdAt — so {g.guild.id} and {g.guild.urlSlug} both resolve. A two-segment reference like {g.guildId} is refused: "as:" names a step\'s output, and a step\'s output holds one or more rows, so a reference always has three segments.',
            'A binding only lasts for the run batch that made it. A step in a later run cannot read a name an earlier run bound with "as" — it fails with cannot resolve reference {g.guild.urlSlug} — nothing has been named yet.',
            "A reference is only substituted inside a goto step's path and a seed step's params. The eval command's source is never touched: braces in JavaScript pass straight through to the page, uninterpreted.",
            'The reset command returns your instance to a clean starting state before you drive a fresh path. It has three levels. page clears browser storage only. state restores disk to a named snapshot and clears browser storage, but keeps server memory. instance restarts every server process, restores disk to the boot state (or to the snapshot named in "to"), and reloads the browser page — the only level that clears server memory and open websockets, and it costs a server boot of a few seconds. state is the one a walker reaches for most.',
            '{ "step": "reset", "level": "state", "to": "guild-with-quest" }',
          ],
        },
        {
          heading: 'THE SEQUENCE, START TO FINISH',
          lines: [
            'Every step above is a value inside a JSON array; dungeonmaster siegelense run is the command that actually drives a batch of them. If something already started your instance and handed you its id, submit steps straight away:',
            'dungeonmaster siegelense run --instance <id> --steps \'[{"step":"goto","path":"/"}]\'',
            'You can also load steps from a file using --steps-file <path>.',
            'In an orchestrated run (siege-happy-walker), the router boots your instance and hands you its id in your brief; start, capacity, and kill belong to the router. If managing your own instance manually instead, here is the whole surface in the order you will want it:',
            'Run dungeonmaster siegelense capacity to see how many instances the machine can currently handle. You are sharing this machine, so always check this first. The start command will refuse to run if the machine is full.',
            'Run dungeonmaster siegelense start --spec stack to boot a new instance. The command waits until the instance is ready, then returns the manifest. The manifest includes the instance ID, URL, file paths, and boot times.',
            'Run dungeonmaster siegelense start --spec api to boot an instance without a web browser, for testing background processes.',
            'Run dungeonmaster siegelense start --idle-timeout-ms <ms> to increase the idle timeout for your instance. Instances normally shut down after 900 seconds of inactivity. If you are testing manually, you should increase this timeout so the instance does not die while you are thinking. This only raises the limit; the timeout is necessary to prevent abandoned instances from running forever.',
            'Run dungeonmaster siegelense run --instance <id> --steps \'[{"step":"goto","path":"/"}]\' to submit a batch of test steps. This returns a basic status summary, not the detailed test data.',
            'Run dungeonmaster siegelense results --instance <id> --run <runId> [--step <n>] [--kind <kind>] to read the detailed test data from disk. This command does not start any instances and works even after the instance is shut down.',
            'Run dungeonmaster siegelense status --instance <id> to see the full details of your instance, including why it crashed if it failed.',
            'Run dungeonmaster siegelense kill --instance <id> to shut down your instance, free up network ports, and remove temporary files. The test evidence will be saved.',
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
            'The run command takes a --stop-on flag. By default (--stop-on error, the same as omitting it) a batch stops at the first step that fails.',
            'Pass --stop-on never to push through every step regardless of failure. The stoppedAt value on the result still names the first failure location — where the batch WOULD have stopped, not where it did.',
            'If you expect a specific step to fail, add "expect": "error" to that step\'s own object, as a field alongside its other fields:',
            '{ "step": "click", "target": "[data-testid=\\"DELETE_DISABLED_BTN\\"]", "expect": "error" }',
            'If a step marked "expect": "error" actually succeeds, the batch stops and reports an error anyway. The application accepting an action it should have refused is itself a bug.',
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
            'A dead instance just means you need to try again, it does not mean the entire test is blocked. In an orchestrated run, mark the dead instance unmet with the status output as evidence; in a manual run, send the instance ID and the status output back to the operator.',
          ],
        },
      ],
    },
    attacking: {
      audience:
        'the stress tester — the session running attacks against one instance and measuring what breaks.',
      summary:
        'This scope covers the health check, the three reset levels, how to expect errors, and how to use baselines. Read the first section carefully: reset and snapshot are what make each attack start from a clean instance.',
      sections: [
        {
          heading: 'READ THIS FIRST',
          lines: [
            'If an attack changes the application state, the next attack must not start from what it left behind. Reset the instance level between them — it restarts the servers and rewinds disk to boot — or boot a fresh instance. Otherwise the second attack tests the damage the first one did.',
            'In an orchestrated run, the router boots a fresh instance for your piece and closes it when done; use reset steps between probes rather than starting instances yourself.',
          ],
        },
        {
          heading: 'HEALTH — ONE READING, ONE VERDICT LINE',
          lines: [
            'The health step takes a standardized reading of the application state so you can compare before and after. You submit it as a step in a run batch: { "step": "health" }. It is the stress tester\'s version of the look command.',
            '{ "step": "health" }',
            'It returns one of three statuses. HEALTHY means the page loaded, the console is clean, there are no server errors, and the server log is clean. DEGRADED means the page loaded but there is a console error. DOWN means the page did not load, the screen is blank, or there are multiple server errors.',
            'The tool intentionally reports a blank screen in both the health step and the screenshot data.',
            'You can perform this exact health check manually using existing commands: check results --kind console for browser errors, results --kind network for failed requests, results --kind server --step <n> --where-level error for server logs — --step narrows the read to that one exact step; --where-steps takes a range like a-b but does not narrow the output by itself, so do not rely on it alone — and check the blank status on your screenshots.',
            'Server logs are critical. If a background process fails, it might not show up in the browser console. Checking the server log is the only way to catch these hidden errors.',
            'Run it as a step within a batch: dungeonmaster siegelense run --instance <id> --steps \'[{"step":"health"}]\'.',
          ],
        },
        {
          heading: 'STATE LIVES IN THREE PLACES, AND ONLY THE INSTANCE LEVEL CLEARS ALL THREE',
          lines: [
            'The disk stores the temporary home directory, logs, and saved data. This can be cleared by restoring a snapshot.',
            'The server memory stores the active API process, background watchers, and caches. This can ONLY be cleared by restarting the server processes, which is what the instance reset level does.',
            'The browser stores local data, session data, active connections, and the current web page. This can be cleared by opening a fresh browser context or manually clearing the storage.',
            'Server memory is the most dangerous place for state to hide. For example, if you send a message, it is saved to disk but also cached in memory. If you only restore the disk snapshot, the server memory will still contain the message from your attack.',
            'If you only clear the disk and assume the application is completely clean, your subsequent tests will produce incorrect results.',
          ],
        },
        {
          heading: 'THE THREE RESET LEVELS',
          lines: [
            'The page level clears browser storage only. It keeps the disk, server memory, open websockets and the loaded page. This takes about one second.',
            '{ "step": "reset", "level": "page" }',
            'The state level restores the disk to a named snapshot and clears browser storage, but it KEEPS SERVER MEMORY and open websockets. This takes about two seconds. You must specify the exact name of the snapshot you want to restore.',
            '{ "step": "reset", "level": "state", "to": "guild-with-quest" }',
            'Use the snapshot step to capture a known-good starting state before running attacks so state-level reset has a target to restore:',
            '{ "step": "snapshot", "as": "guild-with-quest" }',
            'Run dungeonmaster siegelense snapshots --instance <id> to list available restore points. Every run automatically mints run_N:start and run_N:end snapshots alongside your manual ones.',
            'The instance level restarts every server process of the instance on the same ports, restores the disk to the BOOT state — the earliest snapshot on record — or to the snapshot you name in "to", reloads the browser page to the app\'s root and clears its storage, then runs the "reseed" recipe if you give one. Afterwards server memory is empty, open websockets are dropped, and NOT_cleared is empty. It costs a server boot: seconds, not milliseconds. It runs inside your batch like any other step; your connection to the instance survives it.',
            '{ "step": "reset", "level": "instance" }',
            '{ "step": "reset", "level": "instance", "reseed": "guild-empty" }',
            'If a process does not come back after the restart, the step fails naming that process and its log file. The instance is then unusable: kill it and start a new one.',
            'A snapshot only backs up the application data. Logs, screenshots, and test transcripts are completely separate and will survive any reset. Test evidence always accumulates safely.',
            'When you reset the state, the tool reports how many files it actually restored — added, modified, and removed counts, decided by comparing file CONTENT against the target snapshot, never by timestamp. A reset that lands on an already-matching state correctly reports files: 0; a nonzero count is a reading of what changed, not proof by itself that the reset worked.',
            'You must declare which reset level your attack requires. Use the instance level between probes whenever a probe could have left anything in server memory — a cache, a subscription, an exhausted pool, a broken connection. The state level is enough only when a probe could have touched nothing but disk. In an orchestrated run this is how you clear everything between probes without a new instance.',
            'The instance level has three limitations. First, it resets long-running measurements like server uptime, so an attack measuring those must not reset between probes. Second, it only provides a consistent starting point if the setup recipe is perfectly deterministic. Third, every instance reset costs a server boot, so do not reach for it when the state level already clears everything a probe touched.',
          ],
        },
        {
          heading: 'EXPECT: ERROR',
          lines: [
            'The run command takes a --stop-on flag. By default (--stop-on error, the same as omitting it) a batch stops at the first UNEXPECTED failure — a step with no "expect": "error" of its own that failed anyway.',
            'If you expect a specific test step to fail, add "expect": "error" to that step\'s own object. A step marked this way that actually fails counts as a SUCCESS, and the batch continues normally even under the default --stop-on error — an expected failure never needs --stop-on never. --stop-on never only matters for pushing the batch past a REAL, unexpected failure elsewhere in the same batch:',
            '{ "step": "type", "target": "[data-testid=\\"AMOUNT_INPUT\\"]", "value": "-99999999999999", "expect": "error" }',
            'Submit the batch with plain run; no extra flag is needed for the expected failure above to let the batch continue:',
            'dungeonmaster siegelense run --instance <id> --steps \'[{"step":"type","target":"[data-testid=\\"AMOUNT_INPUT\\"]","value":"-99999999999999","expect":"error"}]\'',
            'If a step marked "expect": "error" actually succeeds, the batch stops there and reports it as a failure: declared expect: \'error\' but succeeded. The application accepting an action it should have refused is itself a bug.',
            'If you do not include "expect": "error", the tool assumes the step should succeed, and an unexpected failure there is exactly what --stop-on governs.',
          ],
        },
        {
          heading: 'BASELINES',
          lines: [
            'You do not create your own baselines. You inherit them from the successful test run that proved the starting state. You can read these baseline screenshots using results --instance <id> --run <runId> --kind screenshots. This works even if the original instance was closed hours ago.',
            'To compare two runs within the same instance timeline (such as baseline versus post-attack), run:',
            'dungeonmaster siegelense compare --instance <id> --run-a run_1 --run-b run_2',
            'This returns the error deltas (console, server, network) and pixel diff summary between the two runs.',
            'Comparing your attack results against an already-broken baseline is dangerous. If the baseline was broken, your attack might show no difference, and you will incorrectly report that the application survived the attack.',
            'A screenshot is only approved as a baseline if every test on that screen passed AND there were no previous errors in the test run. If an error happened earlier, the screen might look correct but the application state is actually corrupted.',
            'You will receive the instance ID and run ID for the baseline, but you must manually verify that the baseline is valid.',
            'When testing an error path, the correct result is usually an error message on the screen. If you compare an error path against a happy-path baseline, you will falsely report the error message as a visual bug. Or worse, if the application fails to show the error message, the screens will match and you will incorrectly report the test as successful.',
            'Error messages are often temporary popups. You should verify they exist by checking the screen text, not by comparing pixel differences.',
            'Pixel-perfect comparisons are reliable across different test runs. The application uses a fixed random seed, so the screen will look exactly the same every time.',
          ],
        },
        {
          heading: 'THE ATTACK SEQUENCE, START TO FINISH',
          lines: [
            'Here is the complete sequence for stress-testing an application:',
            'Run dungeonmaster siegelense capacity to check available machine slots before booting.',
            'Run dungeonmaster siegelense start --spec stack (or --spec api for headless testing) to boot a fresh instance. Capture the returned instance ID.',
            'Run a baseline batch to record the starting health and take a snapshot: submit { "step": "health" } and { "step": "snapshot", "as": "clean" } using run.',
            'Run your attack batch with expected failures: dungeonmaster siegelense run --instance <id> --steps \'[{"step":"type","target":"[data-testid=\\"AMOUNT_INPUT\\"]","value":"-99999999999999","expect":"error"}]\'.',
            'Run dungeonmaster siegelense compare --instance <id> --run-a run_1 --run-b run_2 to diff errors and screenshots between the baseline and the attack run.',
            'Run { "step": "reset", "level": "state", "to": "clean" } to restore the clean state for the next attack batch, or { "step": "reset", "level": "instance" } when the attack could have left anything in server memory — it restarts the servers and rewinds disk to boot.',
            'Run dungeonmaster siegelense kill --instance <id> to terminate the instance and free ports when all attacks are complete.',
          ],
        },
        {
          heading: 'SERVER-SIDE FAILURE INJECTION',
          lines: [
            'You can test many types of bad input directly through the web browser, like typing garbage text, entering huge values, or clicking rapidly.',
            'The testing environment fakes the agent CLI and the ward binary. It does not fake other background systems.',
            'The look command is designed to help you find important HTML attributes like maxlength and pattern, as well as live regions where error messages appear. Use the dom command to read these attributes directly when an attack needs to check them.',
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
            'Steps 1 through 4 below do not require a running instance. They only read files from disk. They are completely free and work perfectly even if the instance was shut down hours ago. When debugging manually, Step 5 reproduces on a fresh instance; an orchestrated fixer skips Step 5 entirely.',
            'Every data query on an instance you already named reports its status as alive, killed, dead, or pruned.',
            'A pruned status is an actual result, not empty data — if you query an old test and receive an empty list, you might incorrectly assume the test did nothing. Naming an id the registry never held is a different case: the tool refuses it outright, before touching any file, with exit code 1 and the message No record of the instance id "<id>". Check the id that `dungeonmaster siegelense start` returned. A typo in the id gets you this refusal, never a silent "unknown" result.',
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
            'If you run this command without specifying a step or a kind, you will receive the high-level summary of the entire run (the list of screenshots and where the test stopped) together with the formatted reading for every step the run took.',
            'The tool provides absolute file paths to the screenshots. You can open these paths directly to view the images.',
          ],
        },
        {
          heading: 'STEP 3 — WHAT DID THE SERVER SAY WHILE IT HAPPENED',
          lines: [
            'Run dungeonmaster siegelense results --instance <id> --run <runId> --kind server --step <n> --where-level error to check the server logs for one step; --where-steps takes a range like 6-8, but it does not narrow the output by itself, so use --step for a single step you already know.',
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
            'An orchestrated fixer (siege-happy-fixer or siege-adversarial-fixer) skips this step: you start no lane, and the router re-dispatches the walker to prove your fix. This step applies only when debugging manually outside an orchestrated quest.',
          ],
        },
        {
          heading: 'STEP 6 — WRITE THE REGRESSION TEST WITH THE SAME RECIPES THE PRELUDE NAMED',
          lines: [
            'When you write the final automated test, use the exact same setup recipes that the original test used.',
            'The seed command uses the same backend code as the automated tests, ensuring that the manual test and the automated regression test use the exact same starting state.',
            'Choose the test layer by what the defect is: unit for pure logic, integration for contracts and boundaries, or e2e for painted layout. An adversarial fixer writes its test at the contract/guard/broker layer, never Playwright.',
          ],
        },
        {
          heading: 'STEP 7 — CLOSE WHAT YOU OPENED',
          lines: [
            'Run dungeonmaster siegelense kill --instance <newId> to shut down the instance. You are responsible for closing any instance you start.',
            'This will stop the processes, free up the network ports, and delete the temporary files, but it will safely preserve the evidence directory for future review.',
            'An orchestrated fixer never opens an instance, so it has nothing of its own to close. When testing manually, always kill the instance you started.',
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
    seeding: {
      audience:
        'the seed checker — a session that must not drive a browser, starting its own headless instance to see what a seed recipe really produces, then killing it.',
      summary:
        'This scope covers the whole headless loop: check capacity, start an api instance, run seed, request and file steps, read what came back, and kill the instance. Read no other scope: nothing on the walking, attacking or fixing pages applies to you.',
      sections: [
        {
          heading: 'READ THIS FIRST',
          lines: [
            'You start this instance, so you kill it. Nobody else will. Run kill before you finish, every time, including when a step failed or you are giving up.',
            'You never drive a browser. Start the api spec, which boots the servers and no browser, and use only the four headless verbs below. A browser verb against it fails at once.',
          ],
        },
        {
          heading: 'STEP 1 — CHECK CAPACITY',
          lines: [
            'Run dungeonmaster siegelense capacity --spec api first. You share this machine with other sessions.',
            'If it answers SUGGESTED: 0 (suggested: 0 with --json), do not start an instance. Report that the machine has no room and stop.',
          ],
        },
        {
          heading: 'STEP 2 — START A HEADLESS INSTANCE',
          lines: [
            'Run dungeonmaster siegelense start --spec api. It blocks until the servers answer, then prints the manifest. Keep the instance id it returns.',
            'Add --seed <recipe> to seed as it starts: dungeonmaster siegelense start --spec api --seed guild-empty. This only works for a recipe with no inputs. A recipe that needs inputs goes through a seed step in a run batch instead.',
            'Run dungeonmaster siegelense recipes to see every recipe, its inputs and what it returns.',
          ],
        },
        {
          heading: 'STEP 3 — RUN A BATCH OF HEADLESS STEPS',
          lines: [
            "Use only these four verbs. seed runs a recipe. request calls the app's own API. file reads a file the app wrote under the instance's home. until with a file condition waits for that file to appear.",
            '{ "step": "seed", "recipe": "guild-empty", "as": "g" }',
            '{ "step": "seed", "recipe": "session-with-nested-subagent", "params": { "guild": "{g.guild.id}" }, "as": "s" }',
            '{ "step": "request", "method": "GET", "path": "/api/guilds" }',
            '{ "step": "until", "file": "guilds/<id>/quests/<id>/quest.json", "timeoutMs": 10000 }',
            '{ "step": "file", "path": "guilds/<id>/quests/<id>/quest.json" }',
            'A recipe\'s inputs go inside "params", never on the step itself. "as" names the seed\'s output, and a later seed step reads it back with a three-segment reference like {g.guild.id} — the name, the row, the field.',
            "A reference is substituted only inside a seed step's params. A request path and a file path are used exactly as written, so read the ids from the seed step's reading first, then send a second batch with them written out.",
            'Submit a batch with run:',
            'dungeonmaster siegelense run --instance <id> --steps \'[{"step":"seed","recipe":"guild-empty","as":"g"},{"step":"request","method":"GET","path":"/api/guilds"}]\'',
            'run returns a status and a run id, not the readings.',
          ],
        },
        {
          heading: 'STEP 4 — READ WHAT CAME BACK',
          lines: [
            "Run dungeonmaster siegelense results --instance <id> --run <runId> --kind steps to read every step's reading: the rows each seed made, each request's status and body, each file's contents.",
            'Add --step <n> to read one step alone. Add --kind server to read the server log when a seed or request failed.',
          ],
        },
        {
          heading: 'STEP 5 — KILL THE INSTANCE',
          lines: [
            'Run dungeonmaster siegelense kill --instance <id>. It stops the servers, frees the ports and removes the throwaway home. The evidence stays on disk.',
            'Kill it even when a step failed and even when you stop early. The instance is idle-reaped after 900 seconds, but that is a backstop for a crashed session, not a plan.',
          ],
        },
        {
          heading: 'WHAT THIS SCOPE DOES NOT COVER',
          lines: [
            'Browser verbs, reset, snapshots and attacks are not yours to use, and no other scope applies to you. If a question needs a browser, report it to whoever asked instead of starting a browser instance.',
          ],
        },
      ],
    },
  },
} as const;
