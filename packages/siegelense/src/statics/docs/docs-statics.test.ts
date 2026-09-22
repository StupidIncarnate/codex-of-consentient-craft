import { siegelenseCallStatics } from '../siegelense-call/siegelense-call-statics';

import { docsStatics } from './docs-statics';

describe('docsStatics', () => {
  describe('the five scopes', () => {
    it('VALID: {every pinned scope} => each has its own audience line, in the pinned order', () => {
      expect(
        siegelenseCallStatics.docs.scopes.map((name) => docsStatics.scopes[name].audience),
      ).toStrictEqual([
        'the planner — the session that writes the test sequence and proves that the application reaches its starting state.',
        'the walker — the session driving a browser against one instance and recording what it reads.',
        'the stress tester — the session running attacks against one instance and measuring what breaks.',
        'the fixer — the session that arrives after the walk is over and the instance is gone.',
        'a session nobody orchestrated — no quest dispatched you, and no dispatcher is watching.',
      ]);
    });

    it('VALID: {markers} => the unavailable-capability token is the one every such line carries', () => {
      expect(docsStatics.markers.notBuilt).toBe('NOT BUILT YET');
    });
  });

  describe('the preamble every answer carries', () => {
    it('VALID: {about} => announces the bare-docs overview, names the marker rule and the absent code-reader scope', () => {
      expect(docsStatics.about).toStrictEqual([
        'Run dungeonmaster siegelense docs with no --for flag to see this overview alone. Add --for <scope> to fetch the manual for one role instead.',
        'The siegelense tool launches an instance of an application, interacts with it, and returns readings. You run it using: dungeonmaster siegelense <call>. Steps are passed as values within a run batch; they are not standalone commands.',
        'A command only returns measured readings. It does not decide if a test passes or fails. Comparing two values is a reading, but determining if the result means pass or fail is left to the user.',
        'If a line ends with NOT BUILT YET, it describes a planned feature that is not implemented yet. Do not try to use it. If a different command can do the same job right now, the instructions will tell you. If a line does not have this marker, the feature is fully built and ready to use.',
        'You can use the --for flag to show instructions for a specific role. If you omit this flag, you will see this overview alone, with no per-role instructions.',
        'Each of the five scopes corresponds to a specific role that uses this tool. There is no scope for a code-reading role. This is intentional: an agent that only reads code does not need instructions on how to use siegelense to drive a web browser.',
        'These instructions are provided via a command rather than being hardcoded into agent prompts for three reasons. First, any agent can fetch them dynamically. Second, there is only one central source of documentation to maintain. Third, system prompts have character limits; serving the manual dynamically saves valuable prompt space.',
        'Running dungeonmaster siegelense <call> --help provides different information. It shows the specific flags, errors, and an example for that command. This document is the role-specific manual. Use --help to learn how to run a command, and use this document to understand the rules and concepts.',
      ]);
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

  describe('driving says what no other scope says', () => {
    it('VALID: {driving} => carries every row of the spec table, capacity through cleanup', () => {
      expect(docsStatics.scopes.driving.sections[0]).toStrictEqual({
        heading: 'FIVE THINGS TRUE OF YOU AND OF NO DISPATCHED ROLE',
        lines: [
          'You are sharing this machine with other agents. Run capacity before starting anything. The start command will queue your request if the machine is busy, so starting multiple instances will slow down other tests.',
          'You must call kill yourself. Since no operator is managing you, your instance will stay alive and leak resources until the idle timeout hits, or until another agent runs the cleanup command.',
          'The start command provides the paths to your instance evidence. You must save these paths yourself. There is no command to look them up later, so write them down immediately.',
          'Your instance is marked as unowned, which means its assets are not protected. They will be automatically deleted when they get old.',
          'The cleanup command is completely safe to run. It only removes stale instances and will not interfere with active tests. Run it regularly to prevent orphan processes from building up.',
        ],
      });
    });
  });

  describe('the remaining scopes carry their own headline rule', () => {
    it('VALID: {fixing} => states that the first four reads start nothing', () => {
      expect(docsStatics.scopes.fixing.sections[0].lines[1]).toBe(
        'Steps 1 through 4 below do not require a running instance. They only read files from disk. They are completely free and work perfectly even if the instance was shut down hours ago. You only need to start a new instance for Step 5, when you actually reproduce the bug.',
      );
    });

    it('VALID: {attacking} => names all three reset levels, each declaring what it keeps', () => {
      expect(docsStatics.scopes.attacking.sections[3].lines.slice(0, 3)).toStrictEqual([
        'The page level clears browser storage and reloads the document, but it keeps the disk and server memory. This takes about one second. NOT BUILT YET.',
        'The state level clears the disk and the browser, but it KEEPS SERVER MEMORY. This takes about two seconds. NOT BUILT YET.',
        'The instance level clears everything by starting a completely new process. This takes about twenty seconds. Right now, you can only do this manually by closing the current instance and starting a new one.',
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

    it('VALID: {planning} => names the twenty-three built verbs and marks every other one', () => {
      expect(docsStatics.scopes.planning.sections[5].lines[0]).toBe(
        'There are twenty-three available step verbs: goto, waitFor, click, type, screenshot, eval, look, box, seed, until, dom, key, health, resize, request, before, file, storage, paste, hold, video, snapshot, and reset. Any other verb you see in the design is NOT BUILT YET.',
      );
    });

    it('VALID: {planning} => says a prelude CAN create its own starting state, now that seed runs a recipe', () => {
      expect(docsStatics.scopes.planning.sections[5].lines[2]).toBe(
        'The seed command runs a setup recipe to prepare the application state. Run dungeonmaster siegelense recipes to see what recipes are available. You can run a recipe using { step: "seed" } and then use its generated IDs in your test steps.',
      );
    });
  });
});
