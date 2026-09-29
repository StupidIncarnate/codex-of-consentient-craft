import { siegelenseCallStatics } from '../siegelense-call/siegelense-call-statics';
import { stepStatics } from '../step/step-statics';

import { docsStatics } from './docs-statics';

describe('docsStatics', () => {
  describe('the four scopes', () => {
    it('VALID: {every pinned scope} => each has its own audience line, in the pinned order', () => {
      expect(
        siegelenseCallStatics.docs.scopes.map((name) => docsStatics.scopes[name].audience),
      ).toStrictEqual([
        'the walker — the session driving a browser against one instance and recording what it reads.',
        'the stress tester — the session running attacks against one instance and measuring what breaks.',
        'the fixer — the session that arrives after the walk is over and the instance is gone.',
        'the seed checker — a session that must not drive a browser, starting its own headless instance to see what a seed recipe really produces, then killing it.',
      ]);
    });

    it('INVALID: {planning, driving} => both scopes are deleted; no prompt sends any agent to them', () => {
      expect({
        planning: 'planning' in docsStatics.scopes,
        driving: 'driving' in docsStatics.scopes,
        walking: 'walking' in docsStatics.scopes,
        attacking: 'attacking' in docsStatics.scopes,
        fixing: 'fixing' in docsStatics.scopes,
        seeding: 'seeding' in docsStatics.scopes,
      }).toStrictEqual({
        planning: false,
        driving: false,
        walking: true,
        attacking: true,
        fixing: true,
        seeding: true,
      });
    });
  });

  describe('the preamble the bare call carries', () => {
    it('VALID: {about} => announces the bare-docs overview and the absent code-reader scope, with no NOT BUILT YET marker', () => {
      expect(docsStatics.about).toStrictEqual([
        'Run dungeonmaster siegelense docs with no --for flag to see this overview alone. Add --for <scope> to fetch the manual for one role instead.',
        'The siegelense tool launches an instance of an application, interacts with it, and returns readings. You run it using: dungeonmaster siegelense <call>. Steps are passed as values within a run batch; they are not standalone commands.',
        'A command only returns measured readings. It does not decide if a test passes or fails. Comparing two values is a reading, but determining if the result means pass or fail is left to the user.',
        'You can use the --for flag to show instructions for a specific role. If you omit this flag, you will see this overview alone, with no per-role instructions.',
        'Each of the four scopes corresponds to a specific role that uses this tool. There is no scope for a code-reading role. This is intentional: an agent that only reads code does not need instructions on how to use siegelense to drive a web browser.',
        'These instructions are provided via a command rather than being hardcoded into agent prompts for three reasons. First, any agent can fetch them dynamically. Second, there is only one central source of documentation to maintain. Third, system prompts have character limits; serving the manual dynamically saves valuable prompt space.',
        'Running dungeonmaster siegelense <call> --help provides different information. It shows the specific flags, errors, and an example for that command. This document is the role-specific manual. Use --help to learn how to run a command, and use this document to understand the rules and concepts.',
      ]);
    });
  });

  describe('no line anywhere carries the retired NOT BUILT YET marker', () => {
    it('INVALID: {every scope} => no section line ends with, or contains, NOT BUILT YET', () => {
      const scopeLines = Object.values(docsStatics.scopes).flatMap((scope) =>
        scope.sections.flatMap((section) => section.lines),
      );
      const allLines = [...docsStatics.about, ...scopeLines];

      expect(allLines.some((line) => line.includes('NOT BUILT YET'))).toBe(false);
    });
  });

  describe('walking carries the ladder', () => {
    it('VALID: {walking} => the rule line first, then the rungs cheapest-first with dom last of the readings', () => {
      expect(docsStatics.scopes.walking.sections[1]).toStrictEqual({
        heading: 'THE LADDER',
        lines: [
          'Always try to use the look command first. Only use the dom command as a last resort, and always target it as narrowly as possible.',
          'Rung 1, look — the default tool. It tells you what elements exist, what they are called, and if they have any errors. It is efficient.',
          'Rung 2, look { within } — the same command, but restricted to a specific section of the page. Use this when the page is too crowded or has a very long list of items. It is faster. The within parameter accepts a simple testId or a full CSS selector like [data-testid="..."]',
          'Rung 3, box { ref } — provides the exact physical dimensions and position of a single element on the screen.',
          'Rung 4, dom { target } — the escape hatch. Use this only when you need to answer a specific question that the look command cannot answer. It can be very slow and resource-intensive if used carelessly.',
          'Rung 5, eval — runs custom JavaScript on the page. This is a different kind of escape hatch. It is fast, but it risks breaking the rules by calculating test results inside the browser instead of returning raw data.',
        ],
      });
    });

    it('VALID: {walking} => carries no "built" status marker anywhere in the scope (fully/not/is/are built)', () => {
      const allLines = docsStatics.scopes.walking.sections.flatMap((section) => section.lines);

      expect(allLines.some((line) => /\b(?:fully|not|is|are)\s+built\b/iu.test(line))).toBe(false);
    });

    it('VALID: {walking} => opens by teaching the key, before any verb is taught', () => {
      expect(docsStatics.scopes.walking.sections[0].lines[0]).toBe(
        'The look command returns a structured list of every interactable element on the page. Each element has a temporary ref ID that you can use to interact with it. It tells you exactly what is on the screen and how to target specific elements. Always run look before trying to click anything.',
      );
    });

    it("VALID: {walking} => dom's three guards are carried with the hatch, cap included", () => {
      expect(docsStatics.scopes.walking.sections[2].lines[3]).toBe(
        'The dom command has three built-in safety features. First, it only reads direct text nodes by default unless you explicitly ask for full textContent. Second, you must specify which fields you want to read. Third, it has a maximum limit on how many items it will return, but it will tell you the true total count so you know if items were skipped.',
      );
    });
  });

  describe('walking teaches the whole verb catalog with no wrong count (DEF-29)', () => {
    it('VALID: {walking, AVAILABLE STEP VERBS} => opens naming every verb the step contract accepts, derived rather than hand-typed', () => {
      const section = docsStatics.scopes.walking.sections.find(
        (candidate) => candidate.heading === 'AVAILABLE STEP VERBS',
      );

      expect(section?.lines[0]).toBe(
        `The step contract accepts ${stepStatics.verbs.all.length} step verbs: ${stepStatics.verbs.all.join(', ')}. You submit them as a list of steps in a run batch, not as individual commands. This page shows a worked example for the verbs a walker reaches for most; every other verb works exactly as its name suggests.`,
      );
    });

    it('VALID: {walking} => names no wrong verb count anywhere on the page', () => {
      const allLines = docsStatics.scopes.walking.sections.flatMap((section) => section.lines);

      expect(allLines.some((line) => line.includes('ten available actions'))).toBe(false);
    });

    it('VALID: {walking} => teaches the seed step and the reset step, which the walker prompt requires', () => {
      const allLines = docsStatics.scopes.walking.sections.flatMap((section) => section.lines);

      expect({
        teachesSeed: allLines.some((line) => line.includes('"step": "seed"')),
        teachesReset: allLines.some((line) => line.includes('"step": "reset"')),
      }).toStrictEqual({
        teachesSeed: true,
        teachesReset: true,
      });
    });
  });

  describe('walking shows how to use the tool, start to finish (DEF-28)', () => {
    it('VALID: {walking} => shows a working run --instance <id> --steps example', () => {
      const allLines = docsStatics.scopes.walking.sections.flatMap((section) => section.lines);

      expect(allLines.some((line) => line.includes('run --instance <id> --steps'))).toBe(true);
    });

    it('VALID: {walking, THE SEQUENCE START TO FINISH} => carries every row of the driving surface, capacity through kill', () => {
      const section = docsStatics.scopes.walking.sections.find(
        (candidate) => candidate.heading === 'THE SEQUENCE, START TO FINISH',
      );

      expect(section?.lines.slice(4)).toStrictEqual([
        'Run dungeonmaster siegelense capacity to see how many instances the machine can currently handle. You are sharing this machine, so always check this first. The start command will refuse to run if the machine is full.',
        'Run dungeonmaster siegelense start --spec stack to boot a new instance. The command waits until the instance is ready, then returns the manifest. The manifest includes the instance ID, URL, file paths, and boot times.',
        'Run dungeonmaster siegelense start --spec api to boot an instance without a web browser, for testing background processes.',
        'Run dungeonmaster siegelense start --idle-timeout-ms <ms> to increase the idle timeout for your instance. Instances normally shut down after 900 seconds of inactivity. If you are testing manually, you should increase this timeout so the instance does not die while you are thinking. This only raises the limit; the timeout is necessary to prevent abandoned instances from running forever.',
        'Run dungeonmaster siegelense run --instance <id> --steps \'[{"step":"goto","path":"/"}]\' to submit a batch of test steps. This returns a basic status summary, not the detailed test data.',
        'Run dungeonmaster siegelense results --instance <id> --run <runId> [--step <n>] [--kind <kind>] to read the detailed test data from disk. This command does not start any instances and works even after the instance is shut down.',
        'Run dungeonmaster siegelense status --instance <id> to see the full details of your instance, including why it crashed if it failed.',
        'Run dungeonmaster siegelense kill --instance <id> to shut down your instance, free up network ports, and remove temporary files. The test evidence will be saved.',
      ]);
    });
  });

  describe('STOPON AND EXPECT names --stop-on as a run flag with a real expect example (DEF-27)', () => {
    it('VALID: {walking} => names --stop-on as a flag on run, and shows expect as a step field', () => {
      const section = docsStatics.scopes.walking.sections.find(
        (candidate) => candidate.heading === 'STOPON AND EXPECT',
      );
      const joinedLines = section!.lines.join(' ');

      expect({
        namesStopOnAsARunFlag: joinedLines.includes('The run command takes a --stop-on flag'),
        showsExpectAsAStepField: section!.lines.some((line) => line.startsWith('{ "step":')),
      }).toStrictEqual({
        namesStopOnAsARunFlag: true,
        showsExpectAsAStepField: true,
      });
    });

    it('VALID: {attacking} => carries the same --stop-on and expect facts the walking page does', () => {
      const section = docsStatics.scopes.attacking.sections.find(
        (candidate) => candidate.heading === 'EXPECT: ERROR',
      );
      const joinedLines = section!.lines.join(' ');

      expect({
        namesStopOnAsARunFlag: joinedLines.includes('The run command takes a --stop-on flag'),
        showsExpectAsAStepField: section!.lines.some((line) => line.startsWith('{ "step":')),
      }).toStrictEqual({
        namesStopOnAsARunFlag: true,
        showsExpectAsAStepField: true,
      });
    });
  });

  describe('every fenced-looking json example is valid JSON (DEF-30)', () => {
    it('VALID: {walking, attacking, fixing, seeding} => every line starting with { "step": parses with JSON.parse, and at least one exists', () => {
      const allLines = [
        ...docsStatics.scopes.walking.sections,
        ...docsStatics.scopes.attacking.sections,
        ...docsStatics.scopes.fixing.sections,
        ...docsStatics.scopes.seeding.sections,
      ].flatMap((section) => section.lines);
      const fencedLines = allLines.filter((line) => line.startsWith('{ "step":'));
      const parsedLines = fencedLines.map((line) => JSON.parse(line));

      expect(parsedLines.length).toBeGreaterThan(0);
    });
  });

  describe('the remaining scopes carry their own headline rule', () => {
    it('VALID: {fixing} => states that the first four reads start nothing', () => {
      expect(docsStatics.scopes.fixing.sections[0].lines[1]).toBe(
        'Steps 1 through 4 below do not require a running instance. They only read files from disk. They are completely free and work perfectly even if the instance was shut down hours ago. When debugging manually, Step 5 reproduces on a fresh instance; an orchestrated fixer skips Step 5 entirely.',
      );
    });

    it('VALID: {fixing} => STEP 7 closes what the fixer opened at STEP 5', () => {
      expect(docsStatics.scopes.fixing.sections[7].heading).toBe('STEP 7 — CLOSE WHAT YOU OPENED');
    });

    it('VALID: {fixing, STEP 2} => a bare results --run promises the run summary together with every step reading, not the summary alone (DEF-96)', () => {
      const section = docsStatics.scopes.fixing.sections.find(
        (candidate) => candidate.heading === 'STEP 2 — WHAT DID THE FAILING STEP ACTUALLY READ',
      );

      expect(section?.lines[2]).toBe(
        'If you run this command without specifying a step or a kind, you will receive the high-level summary of the entire run (the list of screenshots and where the test stopped) together with the formatted reading for every step the run took.',
      );
    });

    it('VALID: {attacking} => names all three reset levels, each declaring what it keeps, with a real reset example', () => {
      expect(docsStatics.scopes.attacking.sections[3].lines.slice(0, 4)).toStrictEqual([
        'The page level clears browser storage only. It keeps the disk, server memory, open websockets and the loaded page. This takes about one second.',
        '{ "step": "reset", "level": "page" }',
        'The state level restores the disk to a named snapshot and clears browser storage, but it KEEPS SERVER MEMORY and open websockets. This takes about two seconds. You must specify the exact name of the snapshot you want to restore.',
        '{ "step": "reset", "level": "state", "to": "guild-with-quest" }',
      ]);
    });

    it('VALID: {attacking} => the instance level restarts the servers, clears server memory and websockets, and costs a server boot', () => {
      const section = docsStatics.scopes.attacking.sections.find(
        (candidate) => candidate.heading === 'THE THREE RESET LEVELS',
      );

      expect(section?.lines.slice(7, 11)).toStrictEqual([
        'The instance level restarts every server process of the instance on the same ports, restores the disk to the BOOT state — the earliest snapshot on record — or to the snapshot you name in "to", reloads the browser page to the app\'s root and clears its storage, then runs the "reseed" recipe if you give one. Afterwards server memory is empty, open websockets are dropped, and NOT_cleared is empty. It costs a server boot: seconds, not milliseconds. It runs inside your batch like any other step; your connection to the instance survives it.',
        '{ "step": "reset", "level": "instance" }',
        '{ "step": "reset", "level": "instance", "reseed": "guild-empty" }',
        'If a process does not come back after the restart, the step fails naming that process and its log file. The instance is then unusable: kill it and start a new one.',
      ]);
    });

    it('VALID: {attacking} => tells the attacker to reset the instance level between probes that could touch server memory', () => {
      const allLines = docsStatics.scopes.attacking.sections.flatMap((section) => section.lines);

      expect(
        allLines.filter((line) => line.startsWith('You must declare which reset level')),
      ).toStrictEqual([
        'You must declare which reset level your attack requires. Use the instance level between probes whenever a probe could have left anything in server memory — a cache, a subscription, an exhausted pool, a broken connection. The state level is enough only when a probe could have touched nothing but disk. In an orchestrated run this is how you clear everything between probes without a new instance.',
      ]);
    });

    it('INVALID: {walking, attacking} => no line claims a reset leaves server memory behind at the instance level or that a restart needs kill then start', () => {
      const allLines = [
        ...docsStatics.scopes.walking.sections,
        ...docsStatics.scopes.attacking.sections,
      ].flatMap((section) => [section.heading, ...section.lines]);

      expect(
        allLines.filter((line) =>
          /can never restart|start a fresh instance if memory is corrupted|NO SINGLE ACTION/u.test(
            line,
          ),
        ),
      ).toStrictEqual([]);
    });

    it('VALID: {attacking} => distinguishes orchestrated run instance lifecycle from manual run in READ THIS FIRST', () => {
      expect(docsStatics.scopes.attacking.sections[0].lines).toStrictEqual([
        'If an attack changes the application state, the next attack must not start from what it left behind. Reset the instance level between them — it restarts the servers and rewinds disk to boot — or boot a fresh instance. Otherwise the second attack tests the damage the first one did.',
        'In an orchestrated run, the router boots a fresh instance for your piece and closes it when done; use reset steps between probes rather than starting instances yourself.',
      ]);
    });

    it('VALID: {attacking} => gives the manual queries matching the health reading', () => {
      expect(docsStatics.scopes.attacking.sections[1].lines[4]).toBe(
        'You can perform this exact health check manually using existing commands: check results --kind console for browser errors, results --kind network for failed requests, results --kind server --step <n> --where-level error for server logs — --step narrows the read to that one exact step; --where-steps takes a range like a-b but does not narrow the output by itself, so do not rely on it alone — and check the blank status on your screenshots.',
      );
    });

    it('VALID: {attacking} => teaches health and snapshot steps and run batch invocation', () => {
      const allLines = docsStatics.scopes.attacking.sections.flatMap((section) => section.lines);

      expect({
        teachesHealth: allLines.some((line) => line === '{ "step": "health" }'),
        teachesSnapshot: allLines.some((line) => line.includes('"step": "snapshot"')),
        teachesRunCommand: allLines.some((line) => line.includes('run --instance <id> --steps')),
      }).toStrictEqual({
        teachesHealth: true,
        teachesSnapshot: true,
        teachesRunCommand: true,
      });
    });
  });

  describe('seeding teaches the headless loop and nothing else', () => {
    it('VALID: {seeding} => its sections run capacity, start, run, results, kill, then the out-of-scope list, in that order', () => {
      expect(docsStatics.scopes.seeding.sections.map((section) => section.heading)).toStrictEqual([
        'READ THIS FIRST',
        'STEP 1 — CHECK CAPACITY',
        'STEP 2 — START A HEADLESS INSTANCE',
        'STEP 3 — RUN A BATCH OF HEADLESS STEPS',
        'STEP 4 — READ WHAT CAME BACK',
        'STEP 5 — KILL THE INSTANCE',
        'WHAT THIS SCOPE DOES NOT COVER',
      ]);
    });

    it('VALID: {seeding} => refuses to start when capacity answers suggested 0', () => {
      expect(docsStatics.scopes.seeding.sections[1].lines).toStrictEqual([
        'Run dungeonmaster siegelense capacity --spec api first. You share this machine with other sessions.',
        'If it answers SUGGESTED: 0 (suggested: 0 with --json), do not start an instance. Report that the machine has no room and stop.',
      ]);
    });

    it('VALID: {seeding} => every example step uses only the four headless verbs, and all four appear', () => {
      const steps = docsStatics.scopes.seeding.sections
        .flatMap((section) => section.lines)
        .filter((line) => line.startsWith('{ "step":'))
        .map((line) => line.split('"')[3]);

      expect(steps).toStrictEqual(['seed', 'seed', 'request', 'until', 'file']);
    });

    it('VALID: {seeding} => says to kill the instance always, and that the idle timeout is only a backstop', () => {
      expect(docsStatics.scopes.seeding.sections[5].lines).toStrictEqual([
        'Run dungeonmaster siegelense kill --instance <id>. It stops the servers, frees the ports and removes the throwaway home. The evidence stays on disk.',
        'Kill it even when a step failed and even when you stop early. The instance is idle-reaped after 900 seconds, but that is a backstop for a crashed session, not a plan.',
      ]);
    });

    it('VALID: {seeding} => starts the headless api spec and limits --seed to recipes with no inputs', () => {
      expect(docsStatics.scopes.seeding.sections[2].lines.slice(0, 2)).toStrictEqual([
        'Run dungeonmaster siegelense start --spec api. It blocks until the servers answer, then prints the manifest. Keep the instance id it returns.',
        'Add --seed <recipe> to seed as it starts: dungeonmaster siegelense start --spec api --seed guild-empty. This only works for a recipe with no inputs. A recipe that needs inputs goes through a seed step in a run batch instead.',
      ]);
    });

    it('VALID: {seeding} => names what it does not cover and sends the reader to no other scope', () => {
      expect(docsStatics.scopes.seeding.sections[6].lines).toStrictEqual([
        'Browser verbs, reset, snapshots and attacks are not yours to use, and no other scope applies to you. If a question needs a browser, report it to whoever asked instead of starting a browser instance.',
      ]);
    });
  });
});
