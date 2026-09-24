import { siegelenseCallStatics } from '../siegelense-call/siegelense-call-statics';
import { stepStatics } from '../step/step-statics';

import { docsStatics } from './docs-statics';

describe('docsStatics', () => {
  describe('the three scopes', () => {
    it('VALID: {every pinned scope} => each has its own audience line, in the pinned order', () => {
      expect(
        siegelenseCallStatics.docs.scopes.map((name) => docsStatics.scopes[name].audience),
      ).toStrictEqual([
        'the walker — the session driving a browser against one instance and recording what it reads.',
        'the stress tester — the session running attacks against one instance and measuring what breaks.',
        'the fixer — the session that arrives after the walk is over and the instance is gone.',
      ]);
    });

    it('INVALID: {planning, driving} => both scopes are deleted; no prompt sends any agent to them', () => {
      expect({
        planning: 'planning' in docsStatics.scopes,
        driving: 'driving' in docsStatics.scopes,
        walking: 'walking' in docsStatics.scopes,
        attacking: 'attacking' in docsStatics.scopes,
        fixing: 'fixing' in docsStatics.scopes,
      }).toStrictEqual({
        planning: false,
        driving: false,
        walking: true,
        attacking: true,
        fixing: true,
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
        'Each of the three scopes corresponds to a specific role that uses this tool. There is no scope for a code-reading role. This is intentional: an agent that only reads code does not need instructions on how to use siegelense to drive a web browser.',
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
          'Rung 1, look — the default tool. It tells you what elements exist, what they are called, and if they have any errors. It is efficient and fully built.',
          'Rung 2, look { within } — the same command, but restricted to a specific section of the page. Use this when the page is too crowded or has a very long list of items. It is faster and fully built. The within parameter accepts a simple testId or a full CSS selector like [data-testid="..."]',
          'Rung 3, box { ref } — provides the exact physical dimensions and position of a single element on the screen. Fully built.',
          'Rung 4, dom { target } — the escape hatch. Use this only when you need to answer a specific question that the look command cannot answer. It can be very slow and resource-intensive if used carelessly. Fully built.',
          'Rung 5, eval — runs custom JavaScript on the page. This is a different kind of escape hatch. It is fast, but it risks breaking the rules by calculating test results inside the browser instead of returning raw data.',
        ],
      });
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
    it('VALID: {walking, THE VERBS YOU CAN SUBMIT TODAY} => opens naming every verb the step contract accepts, derived rather than hand-typed', () => {
      const section = docsStatics.scopes.walking.sections.find(
        (candidate) => candidate.heading === 'THE VERBS YOU CAN SUBMIT TODAY',
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
    it('VALID: {walking, attacking, fixing} => every line starting with { "step": parses with JSON.parse, and at least one exists', () => {
      const allLines = [
        ...docsStatics.scopes.walking.sections,
        ...docsStatics.scopes.attacking.sections,
        ...docsStatics.scopes.fixing.sections,
      ].flatMap((section) => section.lines);
      const fencedLines = allLines.filter((line) => line.startsWith('{ "step":'));
      const parsedLines = fencedLines.map((line) => JSON.parse(line));

      expect(parsedLines.length).toBeGreaterThan(0);
    });
  });

  describe('the remaining scopes carry their own headline rule', () => {
    it('VALID: {fixing} => states that the first four reads start nothing', () => {
      expect(docsStatics.scopes.fixing.sections[0].lines[1]).toBe(
        'Steps 1 through 4 below do not require a running instance. They only read files from disk. They are completely free and work perfectly even if the instance was shut down hours ago. You only need to start a new instance for Step 5, when you actually reproduce the bug.',
      );
    });

    it('VALID: {fixing} => STEP 7 closes what the fixer opened at STEP 5', () => {
      expect(docsStatics.scopes.fixing.sections[7].heading).toBe('STEP 7 — CLOSE WHAT YOU OPENED');
    });

    it('VALID: {attacking} => names all three reset levels, each declaring what it keeps, with a real reset example', () => {
      expect(docsStatics.scopes.attacking.sections[3].lines.slice(0, 4)).toStrictEqual([
        'The page level clears browser storage and reloads the document, but it keeps the disk and server memory. This takes about one second.',
        '{ "step": "reset", "level": "page" }',
        'The state level clears the disk and the browser, but it KEEPS SERVER MEMORY. This takes about two seconds. You must specify the exact name of the snapshot you want to restore.',
        '{ "step": "reset", "level": "state", "to": "guild-with-quest" }',
      ]);
    });

    it('VALID: {attacking} => marks health, reset and snapshot as built', () => {
      expect(docsStatics.scopes.attacking.sections[0].lines[0]).toBe(
        'The reset and snapshot commands are BUILT. The health command is BUILT.',
      );
    });

    it('VALID: {attacking} => gives the callable stand-in for the unbuilt health reading', () => {
      expect(docsStatics.scopes.attacking.sections[1].lines[3]).toBe(
        'You can perform this exact health check manually using existing commands: check results --kind console for browser errors, results --kind network for failed requests, results --kind server --where-steps a-b --where-level error for server logs, and check the blank status on your screenshots.',
      );
    });
  });
});
