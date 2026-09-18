import { siegelenseCallStatics } from '../siegelense-call/siegelense-call-statics';
import { stepStatics } from '../step/step-statics';

import { docsStatics } from './docs-statics';

describe('docsStatics', () => {
  describe('the seven scopes', () => {
    it('VALID: {every pinned scope} => each has its own audience line, in the pinned order', () => {
      expect(
        siegelenseCallStatics.docs.scopes.map((name) => docsStatics.scopes[name].audience),
      ).toStrictEqual([
        'the operator — the session that opens and closes a pool of instances and dispatches minions into them.',
        'the planner — the session that writes the walk and proves the prelude reaching its entry state.',
        'the walker — the session driving a browser against one instance and recording what it reads.',
        'the stress tester — the session running attacks against one instance and measuring what breaks.',
        'the fixer — the session that arrives after the walk is over and the instance is gone.',
        'a session nobody orchestrated — no quest dispatched you, and no dispatcher is watching.',
        'a session verifying a flow that has no screen, where siege is the only verification track there is.',
      ]);
    });

    it('VALID: {markers} => the unavailable-capability token is the one every such line carries', () => {
      expect(docsStatics.markers.notBuilt).toBe('NOT BUILT YET');
    });
  });

  describe('operating carries no step vocabulary at all', () => {
    it('VALID: {operating} => none of stepStatics.verbs.all appears anywhere in the scope', () => {
      const operatingText = JSON.stringify(docsStatics.scopes.operating).toLowerCase();

      expect(
        stepStatics.verbs.all.filter((verb) => operatingText.includes(verb.toLowerCase())),
      ).toStrictEqual([]);
    });

    it('VALID: {operating.summary} => states why the driving vocabulary is absent', () => {
      expect(docsStatics.scopes.operating.summary).toBe(
        'Fleet management, at both ends of a pass. You never drive a page, so this scope carries none of that vocabulary: no batch is yours to submit, and handing you the driving verbs would be handing you the one thing your own rules forbid.',
      );
    });
  });

  describe('the preamble every answer carries', () => {
    it('VALID: {about} => names the 50,000-character ceiling, the marker rule and the absent code-reader scope', () => {
      expect(docsStatics.about).toStrictEqual([
        'siegelense stands up one instance of an app, drives it, and hands back READINGS. Every call is: dungeonmaster siegelense <call>. Steps are values inside a run batch, never calls of their own.',
        'A command returns a READING, never a verdict on whether a unit passes. Comparing two measured values is a reading; deciding a unit passed is not.',
        "A line ending NOT BUILT YET names a capability this tool's design has and its code does not. Do not call it. Where something callable does the same job today, the line says what it is. A line with no such marker is callable now.",
        "Use --for to narrow this to one role's page, because the whole surface is not every reader's business. Omit it and you get all seven.",
        'The seven scopes are one per tool-using role. A code-reading role gets no scope, and that absence is deliberate: a session that opens source files and calls nothing here needs no page of these instructions, and handing it one would hand a code reader the vocabulary for driving a browser.',
        'This is served by a call rather than pasted into a prompt for three reasons. Any session can fetch it, so "go drive the app with the siege tool" becomes a usable instruction to a session nobody orchestrated. There is one source to edit rather than one copy per role prompt. And a prompt has a hard ceiling: a served prompt over 50,000 characters is spilled to a file with an error stub handed back, and a full tool manual inside one spends that budget on something a call serves for free.',
        'dungeonmaster siegelense <call> --help is a different document: flags, refusals and one example per call. This is the role-scoped manual. Reach for --help when you need the flag; reach for this when you need the rule.',
      ]);
    });
  });

  describe('walking carries the ladder', () => {
    it('VALID: {walking} => the rule line first, then the rungs cheapest-first with dom last of the readings', () => {
      expect(docsStatics.scopes.walking.sections[1]).toStrictEqual({
        heading: 'THE LADDER',
        lines: [
          'The rule: reach for the key first. dom is the hatch — last, and always with a narrow target.',
          'Rung 1, look — the default. What is here, what is it called, what is wrong with it. About 243 tokens for a whole page. Built.',
          'Rung 2, look { within } — the same reading scoped to one region, when the region is crowded or the page holds a long transcript. Cheaper. Built. `within` takes a bare testId or the full [data-testid="..."] form; both reach the same element.',
          "Rung 3, box { ref } — one element's geometry, exactly. A few lines. Built.",
          'Rung 4, dom { target } — the hatch. A named selector, and a question the key does not carry. Unbounded without care. Built.',
          'Rung 5, eval — a question no step shapes at all. It is a DIFFERENT hatch carrying a different risk: dom is expensive, while eval is cheap and can quietly break the founding rule by computing a verdict inside the page and handing it back as a value.',
        ],
      });
    });

    it('VALID: {walking} => opens by teaching the key, before any verb is taught', () => {
      expect(docsStatics.scopes.walking.sections[0].lines[0]).toBe(
        'look returns the KEY: a tree of every addressable element on the page, one line each, with a ref you can drive. It answers both "what is on this screen" and "how do I address the second of two identical controls". Take one before you plan a click.',
      );
    });

    it("VALID: {walking} => dom's three guards are carried with the hatch, cap included", () => {
      expect(docsStatics.scopes.walking.sections[2].lines[3]).toBe(
        'Three guards arrive with it: own text nodes by default, with text: "full" the opt-in for textContent; a fields: projection, the same way a network query projects; and a match cap that SAYS it capped, with the true count beside it — count: 58, showing 10 is an answer, where ten silent rows is a trap.',
      );
    });
  });

  describe('driving says what no other scope says', () => {
    it('VALID: {driving} => carries every row of the spec table, capacity through cleanup', () => {
      expect(docsStatics.scopes.driving.sections[0]).toStrictEqual({
        heading: 'FIVE THINGS TRUE OF YOU AND OF NO DISPATCHED ROLE',
        lines: [
          'You are sharing this machine. Read capacity before you open anything, and know that start QUEUES rather than refusing — open three instances beside a running pass and that pass measures your pressure as if it were its own.',
          'kill is yours to call and nothing else will. No dispatcher is watching, so your instance leaks until the idle timeout or until somebody else happens to run cleanup.',
          'Your evidence is where start said it was: the manifest carries the instance id and the evidence directory, and you hold both for your whole life. There is no LOOKUP call to recover them later, so anything a person will want tomorrow goes into what you write down, never left in scrollback.',
          'Your instance is filed under unowned — no quest protects it from ageing out. Come back next week for a capture and it was reclaimed on the ordinary window.',
          "cleanup is safe for you to run and will not touch anyone's live work. It acts on staleness only. Run it rather than reaching for something blunter, or orphans accumulate.",
        ],
      });
    });
  });

  describe('the remaining scopes carry their own headline rule', () => {
    it('VALID: {fixing} => states that the first four reads start nothing', () => {
      expect(docsStatics.scopes.fixing.sections[0].lines[1]).toBe(
        'Steps 1 to 4 below start NOTHING. They read the asset tree and the registry, cost no boot and no pool slot, and answer exactly as well for an instance killed an hour ago as for one still running. The first thing that needs a live instance is step 5, which is the reproduction.',
      );
    });

    it('VALID: {attacking} => names all three reset levels, each declaring what it keeps', () => {
      expect(docsStatics.scopes.attacking.sections[3].lines.slice(0, 3)).toStrictEqual([
        'page — clears browser storage and the loaded document. Keeps disk and server memory. About a second. NOT BUILT YET.',
        'state — clears disk, plus everything page clears. KEEPS SERVER MEMORY. About two seconds. NOT BUILT YET.',
        'instance — clears everything: a fresh process, then re-seed. Keeps nothing. About twenty seconds of boot plus the recipe. Reachable today only by closing the instance and booting another.',
      ]);
    });

    it('VALID: {attacking} => gives the callable stand-in for the unbuilt health reading', () => {
      expect(docsStatics.scopes.attacking.sections[1].lines[3]).toBe(
        'Take the same reading by hand today, and every part of it is already callable: results --kind console for errors, --kind network for non-2xx, --kind server --where-steps a-b --where-level error for the server log, and the blank field on the capture the acting step already took.',
      );
    });

    it('VALID: {planning} => names the twelve built verbs and marks every other one', () => {
      expect(docsStatics.scopes.planning.sections[5].lines[0]).toBe(
        'Twelve step verbs exist: goto, waitFor, click, type, screenshot, eval, look, box, seed, until, dom and key. Every other verb in the design is NOT BUILT YET.',
      );
    });

    it('VALID: {planning} => says a prelude CAN create its own starting state, now that seed runs a recipe', () => {
      expect(docsStatics.scopes.planning.sections[5].lines[2]).toBe(
        "seed runs a recipe against the instance and returns the ids it made, so a prelude CAN create its own starting state. dungeonmaster siegelense recipes lists every recipe with its produces: claim; name one in a { step: 'seed' } and read its ids back with {binding.field}.",
      );
    });

    it('VALID: {operational} => says browser steps error by name on a browserless lane, naming the shape rather than a count', () => {
      expect(docsStatics.scopes.operational.sections[1].lines[2]).toBe(
        'Browser steps go missing LOUDLY. A browser step submitted against a browserless instance is an error naming the spec, never an empty reading — a reading that quietly returns nothing is the count: 0 problem arriving at the one place a walk cannot recover from it. This half is BUILT: every browser verb errors by name here — goto, waitFor, click, type, screenshot, eval, look, box, dom and key.',
      );
    });

    it('VALID: {operational} => closes by naming which steps are still unbuilt, and that until { file } is the only until form here', () => {
      expect(docsStatics.scopes.operational.sections[4].lines[0]).toBe(
        '`request`, `file` and `storage` are still NOT BUILT YET; `until { file }` is BUILT and is the only until form this scope gets — its browser siblings (`visible`/`predicate`/`console`/`response`) all refuse here by name. What works today on a browserless lane is: boot it, close it, read its server log off disk, and wait on a file appearing with `until { file }`.',
      );
    });
  });
});
