import { ContentTextStub, FileNameStub } from '@dungeonmaster/shared/contracts';

import { LocatorStateStub } from '../locator-state/locator-state.stub';
import { SelectorStub } from '../selector/selector.stub';
import { UrlPathStub } from '../url-path/url-path.stub';
import { stepContract } from './step-contract';
import { StepStub } from './step.stub';

// Every member's own minimal fixture, built through StepStub so each override goes through
// stepContract.parse rather than a raw literal — one entry per member of stepStatics.verbs.all.
const STEP_FIXTURES = [
  StepStub({ step: 'goto', path: UrlPathStub() }),
  StepStub({ step: 'waitFor', target: SelectorStub(), state: LocatorStateStub() }),
  StepStub({ step: 'click', target: SelectorStub() }),
  StepStub({ step: 'type', target: SelectorStub(), value: ContentTextStub() }),
  StepStub({ step: 'screenshot', name: FileNameStub({ value: 'step1.png' }) }),
  StepStub({ step: 'eval', source: ContentTextStub() }),
  StepStub({ step: 'look' }),
  StepStub({ step: 'box' }),
  StepStub({ step: 'until', visible: SelectorStub() }),
  StepStub({ step: 'key', press: ContentTextStub({ value: 'Enter' }) }),
  StepStub({ step: 'health' }),
  StepStub({ step: 'resize', width: 1280, height: 720 }),
  StepStub({ step: 'request', path: '/api/guilds' }),
  StepStub({ step: 'before', source: ContentTextStub() }),
  StepStub({ step: 'file' }),
];

describe('stepContract', () => {
  describe('every verb, minimal shape', () => {
    describe.each(STEP_FIXTURES)('verb: $step', (fixture) => {
      it('VALID: {step} => parses its own minimal member', () => {
        const result = stepContract.parse(fixture);

        expect(result.step).toBe(fixture.step);
      });
    });
  });

  describe('every member, full shape', () => {
    it('VALID: {step: goto} => parses the complete goto member', () => {
      const result = stepContract.parse({ step: 'goto', path: '/api/guilds', node: null });

      expect(result).toStrictEqual({ step: 'goto', path: '/api/guilds', node: null, expect: 'ok' });
    });

    it('VALID: {step: waitFor} => parses the complete waitFor member', () => {
      const result = stepContract.parse({
        step: 'waitFor',
        target: '[data-testid="SUBAGENT_CHAIN"]',
        within: null,
        state: 'visible',
        timeoutMs: 20000,
        node: 'chain-rendered',
      });

      expect(result).toStrictEqual({
        step: 'waitFor',
        target: '[data-testid="SUBAGENT_CHAIN"]',
        within: null,
        state: 'visible',
        timeoutMs: 20000,
        node: 'chain-rendered',
        expect: 'ok',
      });
    });

    it('VALID: {step: click} => parses the complete click member', () => {
      const result = stepContract.parse({
        step: 'click',
        target: '[data-testid="PIXEL_BTN"]',
        within: '[data-testid="GUILD_LIST"]',
        ref: null,
        timeoutMs: null,
        node: null,
      });

      expect(result).toStrictEqual({
        step: 'click',
        target: '[data-testid="PIXEL_BTN"]',
        within: '[data-testid="GUILD_LIST"]',
        ref: null,
        timeoutMs: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: click, ref} => parses the ref half of the handle rule', () => {
      const result = stepContract.parse({ step: 'click', ref: 26 });

      expect(result).toStrictEqual({
        step: 'click',
        target: null,
        within: null,
        ref: 26,
        timeoutMs: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: type} => parses the complete type member with an explicit expect', () => {
      const result = stepContract.parse({
        step: 'type',
        target: '[data-testid="CHAT_INPUT"]',
        within: null,
        ref: null,
        value: '<script>alert(1)</script>',
        timeoutMs: null,
        node: null,
        expect: 'error',
      });

      expect(result).toStrictEqual({
        step: 'type',
        target: '[data-testid="CHAT_INPUT"]',
        within: null,
        ref: null,
        value: '<script>alert(1)</script>',
        timeoutMs: null,
        node: null,
        expect: 'error',
      });
    });

    it('VALID: {step: look} => parses the whole-page reading with no scope', () => {
      const result = stepContract.parse({ step: 'look' });

      expect(result).toStrictEqual({
        step: 'look',
        within: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: look, within} => parses the scoped reading, rung 2 of the ladder', () => {
      const result = stepContract.parse({ step: 'look', within: 'SUBAGENT_CHAIN' });

      expect(result).toStrictEqual({
        step: 'look',
        within: 'SUBAGENT_CHAIN',
        node: null,
        expect: 'ok',
      });
    });

    it('INVALID: {step: look, +target} => throws naming the stray key, because look reads and never targets', () => {
      expect(() =>
        stepContract.parse({ step: 'look', target: '[data-testid="X"]' } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'target'/u);
    });

    it('VALID: {step: box} => parses the complete box member', () => {
      const result = stepContract.parse({ step: 'box', ref: 26, node: 'target-box' });

      expect(result).toStrictEqual({
        step: 'box',
        ref: 26,
        node: 'target-box',
        expect: 'ok',
      });
    });

    it('INVALID: {step: box, no ref} => throws for the missing ref', () => {
      expect(() => stepContract.parse({ step: 'box' } as never)).toThrow(/Required/u);
    });

    it('INVALID: {step: box, +target} => throws naming the stray key, because box takes ref only', () => {
      expect(() =>
        stepContract.parse({ step: 'box', ref: 26, target: '[data-testid="X"]' } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'target'/u);
    });

    it('VALID: {step: dom} => parses the complete dom member with target, defaults for fields and text', () => {
      const result = stepContract.parse({ step: 'dom', target: '[data-testid="QUEST_ROW"]' });

      expect(result).toStrictEqual({
        step: 'dom',
        target: '[data-testid="QUEST_ROW"]',
        fields: null,
        text: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: dom, fields, text} => parses with fields projection and explicit text mode', () => {
      const result = stepContract.parse({
        step: 'dom',
        target: '[data-testid="TOAST"]',
        fields: ['text', 'rect'],
        text: 'full',
      });

      expect(result).toStrictEqual({
        step: 'dom',
        target: '[data-testid="TOAST"]',
        fields: ['text', 'rect'],
        text: 'full',
        node: null,
        expect: 'ok',
      });
    });

    it('INVALID: {step: dom, no target} => throws for missing target', () => {
      expect(() => stepContract.parse({ step: 'dom' } as never)).toThrow(/Required/u);
    });

    it('INVALID: {step: dom, +ref} => throws naming the stray key, because dom takes target only', () => {
      expect(() =>
        stepContract.parse({
          step: 'dom',
          target: '[data-testid="X"]',
          ref: 26,
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'ref'/u);
    });

    it('VALID: {step: screenshot} => parses the complete screenshot member', () => {
      const result = stepContract.parse({ step: 'screenshot', name: 'step1.png', node: null });

      expect(result).toStrictEqual({
        step: 'screenshot',
        name: 'step1.png',
        node: null,
        expect: 'ok',
      });
    });

    it('INVALID: {step: screenshot, name: "home"} => refuses the extensionless name and says what to type', () => {
      expect(() => stepContract.parse({ step: 'screenshot', name: 'home', node: null })).toThrow(
        /a screenshot name must end in .*\.png.* the capture is a PNG/u,
      );
    });

    it('INVALID: {step: screenshot, name: "home.jpg"} => refuses a non-PNG extension', () => {
      expect(() =>
        stepContract.parse({ step: 'screenshot', name: 'home.jpg', node: null }),
      ).toThrow(/a screenshot name must end in .*\.png.* the capture is a PNG/u);
    });

    it('VALID: {step: eval} => parses the complete eval member', () => {
      const result = stepContract.parse({
        step: 'eval',
        source: 'document.querySelectorAll("button").length',
        node: null,
      });

      expect(result).toStrictEqual({
        step: 'eval',
        source: 'document.querySelectorAll("button").length',
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: key} => parses the complete key member', () => {
      const result = stepContract.parse({
        step: 'key',
        press: 'Enter',
        node: 'confirm',
      });

      expect(result).toStrictEqual({
        step: 'key',
        press: 'Enter',
        node: 'confirm',
        expect: 'ok',
      });
    });

    it('INVALID: {step: key, missing press} => throws for missing press', () => {
      expect(() => stepContract.parse({ step: 'key' } as never)).toThrow(/Required/u);
    });

    it('INVALID: {step: key, +target} => throws naming the stray key, because key takes press only', () => {
      expect(() =>
        stepContract.parse({
          step: 'key',
          press: 'Enter',
          target: '[data-testid="X"]',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'target'/u);
    });

    it('VALID: {step: health} => parses the complete health member', () => {
      const result = stepContract.parse({
        step: 'health',
        node: 'baseline-health',
        expect: 'ok',
      });

      expect(result).toStrictEqual({
        step: 'health',
        node: 'baseline-health',
        expect: 'ok',
      });
    });

    it('VALID: {step: health, defaults} => fills default node and expect', () => {
      const result = stepContract.parse({
        step: 'health',
      });

      expect(result).toStrictEqual({
        step: 'health',
        node: null,
        expect: 'ok',
      });
    });

    it('INVALID: {step: health, +target} => throws naming the stray key, because health takes no target', () => {
      expect(() =>
        stepContract.parse({
          step: 'health',
          target: '[data-testid="X"]',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'target'/u);
    });

    it('VALID: {step: until, visible} => parses the visible form, the other four conditions null', () => {
      const result = stepContract.parse({
        step: 'until',
        visible: '[data-testid="SUBAGENT_CHAIN"]',
        timeoutMs: 20000,
        node: null,
      });

      expect(result).toStrictEqual({
        step: 'until',
        visible: '[data-testid="SUBAGENT_CHAIN"]',
        response: null,
        file: null,
        predicate: null,
        console: null,
        timeoutMs: 20000,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: until, predicate} => parses the predicate form', () => {
      const result = stepContract.parse({
        step: 'until',
        predicate: 'document.querySelectorAll("[data-testid=QUEST_ROW]").length === 3',
      });

      expect(result).toStrictEqual({
        step: 'until',
        visible: null,
        response: null,
        file: null,
        predicate: 'document.querySelectorAll("[data-testid=QUEST_ROW]").length === 3',
        console: null,
        timeoutMs: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: until, console} => parses the console form, the pattern UNWRAPPED', () => {
      const result = stepContract.parse({ step: 'until', console: 'hydrated' });

      expect(result).toStrictEqual({
        step: 'until',
        visible: null,
        response: null,
        file: null,
        predicate: null,
        console: 'hydrated',
        timeoutMs: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: until, response} => parses the response form', () => {
      const result = stepContract.parse({
        step: 'until',
        response: { method: 'POST', path: '/api/quests' },
        timeoutMs: 15000,
      });

      expect(result).toStrictEqual({
        step: 'until',
        visible: null,
        response: { method: 'POST', path: '/api/quests' },
        file: null,
        predicate: null,
        console: null,
        timeoutMs: 15000,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: until, file} => parses the file form, the one that runs on a browserless lane', () => {
      const result = stepContract.parse({
        step: 'until',
        file: 'guilds/g1/quests/q1/quest.json',
        timeoutMs: 10000,
      });

      expect(result).toStrictEqual({
        step: 'until',
        visible: null,
        response: null,
        file: 'guilds/g1/quests/q1/quest.json',
        predicate: null,
        console: null,
        timeoutMs: 10000,
        node: null,
        expect: 'ok',
      });
    });

    it('INVALID: {step: until, console: "/hydrated/"} => throws naming the unwrapped form', () => {
      expect(() => stepContract.parse({ step: 'until', console: '/hydrated/' })).toThrow(
        /a regex SOURCE string, not a regex literal/u,
      );
    });

    it('INVALID: {step: until, file: "/etc/passwd"} => throws naming the lane home', () => {
      expect(() => stepContract.parse({ step: 'until', file: '/etc/passwd' })).toThrow(
        /resolved against the lane's own throwaway home/u,
      );
    });
  });

  describe('the until step: exactly one condition, never zero and never two', () => {
    it('INVALID: {step: until, no condition} => rejected, naming all five forms', () => {
      expect(() => stepContract.parse({ step: 'until' })).toThrow(
        /an `until` step waits on exactly one condition/u,
      );
    });

    it('INVALID: {step: until, visible AND predicate} => rejected', () => {
      expect(() =>
        stepContract.parse({
          step: 'until',
          visible: '[data-testid="X"]',
          predicate: 'true',
        }),
      ).toThrow(/an `until` step waits on exactly one condition/u);
    });

    it('INVALID: {step: until, console AND response} => rejected', () => {
      expect(() =>
        stepContract.parse({
          step: 'until',
          console: 'hydrated',
          response: { method: 'GET', path: '/x' },
        }),
      ).toThrow(/an `until` step waits on exactly one condition/u);
    });

    it('VALID: {step: until, file only} => never graded against the handle rule, which governs click/type only', () => {
      const result = stepContract.parse({ step: 'until', file: 'a.json' });

      expect(result.step).toBe('until');
    });
  });

  describe('rejecting a payload shaped like a different member', () => {
    it('INVALID: {step: goto, target/within, no path} => throws for the missing goto field', () => {
      expect(() =>
        stepContract.parse({
          step: 'goto',
          target: '[data-testid="PIXEL_BTN"]',
          within: null,
          node: null,
        } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {step: waitFor, path, no target/state} => throws for the missing waitFor fields', () => {
      expect(() =>
        stepContract.parse({ step: 'waitFor', path: '/api/guilds', node: null } as never),
      ).toThrow(/Required/u);
    });

    it("INVALID: {step: click, path, no target} => throws naming goto's field as the stray key", () => {
      expect(() =>
        stepContract.parse({ step: 'click', path: '/api/guilds', node: null } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'path'/u);
    });

    it('INVALID: {step: type, target, no value} => throws for the missing type field', () => {
      expect(() =>
        stepContract.parse({
          step: 'type',
          target: '[data-testid="CHAT_INPUT"]',
          within: null,
          timeoutMs: null,
          node: null,
        } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {step: screenshot, source, no name} => throws for the missing screenshot field', () => {
      expect(() =>
        stepContract.parse({ step: 'screenshot', source: 'document.title', node: null } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {step: eval, name, no source} => throws for the missing eval field', () => {
      expect(() =>
        stepContract.parse({ step: 'eval', name: 'step1.png', node: null } as never),
      ).toThrow(/Required/u);
    });
  });

  describe('rejecting a field that belongs to a different member', () => {
    it('INVALID: {step: goto, +target from click/waitFor/type} => throws naming the stray key', () => {
      expect(() =>
        stepContract.parse({
          step: 'goto',
          path: '/api/guilds',
          node: null,
          target: '[data-testid="PIXEL_BTN"]',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'target'/u);
    });

    it('INVALID: {step: waitFor, +path from goto} => throws naming the stray key', () => {
      expect(() =>
        stepContract.parse({
          step: 'waitFor',
          target: '[data-testid="SUBAGENT_CHAIN"]',
          within: null,
          state: 'visible',
          timeoutMs: 20000,
          node: null,
          path: '/api/guilds',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'path'/u);
    });

    it('INVALID: {step: click, +value from type} => throws naming the stray key', () => {
      expect(() =>
        stepContract.parse({
          step: 'click',
          target: '[data-testid="PIXEL_BTN"]',
          within: null,
          timeoutMs: null,
          node: null,
          value: '<script>alert(1)</script>',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'value'/u);
    });

    it('INVALID: {step: type, +name from screenshot} => throws naming the stray key', () => {
      expect(() =>
        stepContract.parse({
          step: 'type',
          target: '[data-testid="CHAT_INPUT"]',
          within: null,
          value: '<script>alert(1)</script>',
          timeoutMs: null,
          node: null,
          name: 'step1.png',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'name'/u);
    });

    it('INVALID: {step: screenshot, +source from eval} => throws naming the stray key', () => {
      expect(() =>
        stepContract.parse({
          step: 'screenshot',
          name: 'step1.png',
          node: null,
          source: 'document.title',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'source'/u);
    });

    it('INVALID: {step: eval, +path from goto} => throws naming the stray key', () => {
      expect(() =>
        stepContract.parse({
          step: 'eval',
          source: 'document.querySelectorAll("button").length',
          node: null,
          path: '/api/guilds',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'path'/u);
    });

    it('INVALID: {step: eval, +path from goto} => throws the exact rendered message', () => {
      expect(() =>
        stepContract.parse({
          step: 'eval',
          source: 'document.querySelectorAll("button").length',
          node: null,
          path: '/api/guilds',
        } as never),
      ).toThrow(
        '[\n' +
          '  {\n' +
          '    "code": "unrecognized_keys",\n' +
          '    "keys": [\n' +
          '      "path"\n' +
          '    ],\n' +
          '    "path": [],\n' +
          '    "message": "Unrecognized key(s) in object: \'path\'"\n' +
          '  }\n' +
          ']',
      );
    });

    it('INVALID: {step: until, +path from goto} => throws naming the stray key', () => {
      expect(() =>
        stepContract.parse({
          step: 'until',
          visible: '[data-testid="X"]',
          path: '/api/guilds',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'path'/u);
    });

    it('INVALID: {step: waitFor, misspelled "taget"} => throws naming the misspelled key', () => {
      expect(() =>
        stepContract.parse({
          step: 'waitFor',
          taget: '[data-testid="SUBAGENT_CHAIN"]',
          within: null,
          state: 'visible',
          timeoutMs: 20000,
          node: null,
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'taget'/u);
    });
  });

  describe('an unknown discriminator', () => {
    it('INVALID: {step: "teleport"} => throws for a verb outside the union', () => {
      expect(() =>
        stepContract.parse({ step: 'teleport', target: '[data-testid="X"]' } as never),
      ).toThrow(/Invalid discriminator/u);
    });

    it('INVALID: {step: "teleport", every field of every member} => discriminator error wins over any unknown-key error', () => {
      expect(() =>
        stepContract.parse({
          step: 'teleport',
          path: '/api/guilds',
          target: '[data-testid="X"]',
          within: null,
          state: 'visible',
          timeoutMs: null,
          value: 'hello',
          name: 'step1.png',
          source: 'document.title',
          node: null,
        } as never),
      ).toThrow(/Invalid discriminator/u);
    });
  });

  describe('the handle rule: a target OR a ref, never both and never neither', () => {
    it('INVALID: {step: click with both a target and a ref} => rejected, naming both kinds of handle', () => {
      expect(() =>
        stepContract.parse({ step: 'click', target: '[data-testid="PIXEL_BTN"]', ref: 26 }),
      ).toThrow(/a driving step takes exactly one handle/u);
    });

    it('INVALID: {step: click with neither} => rejected, naming both kinds of handle', () => {
      expect(() => stepContract.parse({ step: 'click' })).toThrow(
        /a driving step takes exactly one handle/u,
      );
    });

    it('INVALID: {step: type with both} => rejected', () => {
      expect(() =>
        stepContract.parse({
          step: 'type',
          target: '[data-testid="CHAT_INPUT"]',
          ref: 14,
          value: 'x',
        }),
      ).toThrow(/a driving step takes exactly one handle/u);
    });

    it('INVALID: {step: type with neither} => rejected', () => {
      expect(() => stepContract.parse({ step: 'type', value: 'x' })).toThrow(
        /a driving step takes exactly one handle/u,
      );
    });

    it('VALID: {step: goto} => never graded against the handle rule, because it carries no handle at all', () => {
      const result = stepContract.parse({ step: 'goto', path: '/' });

      expect(result).toStrictEqual({ step: 'goto', path: '/', node: null, expect: 'ok' });
    });

    it('VALID: {step: look} => never graded against the handle rule either', () => {
      const result = stepContract.parse({ step: 'look' });

      expect(result).toStrictEqual({ step: 'look', within: null, node: null, expect: 'ok' });
    });
  });

  describe('the expect default', () => {
    it('EDGE: {expect omitted} => defaults to ok', () => {
      const result = stepContract.parse({ step: 'goto', path: '/api/guilds', node: null });

      expect(result.expect).toBe('ok');
    });
  });

  describe('the node/within/timeoutMs defaults', () => {
    it('EDGE: {step: goto, path: "/", node omitted} => parses to the complete member with node null', () => {
      const result = stepContract.parse({ step: 'goto', path: '/' });

      expect(result).toStrictEqual({ step: 'goto', path: '/', node: null, expect: 'ok' });
    });

    it('EDGE: {step: click, target, within/timeoutMs/node omitted} => parses to the complete member with all three null', () => {
      const result = stepContract.parse({
        step: 'click',
        target: '[data-testid="GUILD_ADD"]',
      });

      expect(result).toStrictEqual({
        step: 'click',
        target: '[data-testid="GUILD_ADD"]',
        within: null,
        ref: null,
        timeoutMs: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: goto, path: "/", node: null explicit} => still parses to node null', () => {
      const result = stepContract.parse({ step: 'goto', path: '/', node: null });

      expect(result).toStrictEqual({ step: 'goto', path: '/', node: null, expect: 'ok' });
    });

    it('EDGE: {step: until, visible, timeoutMs omitted} => defaults timeoutMs to null, resolved later by driverStatics', () => {
      const result = stepContract.parse({ step: 'until', visible: '[data-testid="X"]' });

      expect(result).toStrictEqual({
        step: 'until',
        visible: '[data-testid="X"]',
        response: null,
        file: null,
        predicate: null,
        console: null,
        timeoutMs: null,
        node: null,
        expect: 'ok',
      });
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a click step with no node and the default expectation', () => {
      const result = StepStub();

      expect(result).toStrictEqual({
        step: 'click',
        target: '[data-testid="GUILD_ADD"]',
        within: null,
        ref: null,
        timeoutMs: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {ref override} => drops the default target, so naming a ref names that handle and no other', () => {
      const result = StepStub({ step: 'click', ref: 26 });

      expect(result).toStrictEqual({
        step: 'click',
        target: null,
        within: null,
        ref: 26,
        timeoutMs: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: look} => creates the whole-page reading', () => {
      const result = StepStub({ step: 'look' });

      expect(result).toStrictEqual({
        step: 'look',
        within: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: box} => creates the box reading step with default ref', () => {
      const result = StepStub({ step: 'box' });

      expect(result).toStrictEqual({
        step: 'box',
        ref: 26,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: dom} => creates the dom reading step with default target', () => {
      const result = StepStub({ step: 'dom' });

      expect(result).toStrictEqual({
        step: 'dom',
        target: '[data-testid="GUILD_ADD"]',
        fields: null,
        text: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: until} => defaults to the visible form', () => {
      const result = StepStub({ step: 'until' });

      expect(result).toStrictEqual({
        step: 'until',
        visible: '[data-testid="GUILD_ADD"]',
        response: null,
        file: null,
        predicate: null,
        console: null,
        timeoutMs: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: until, predicate override} => drops the default visible, so naming a different condition names that one alone', () => {
      const result = StepStub({ step: 'until', predicate: 'true' });

      expect(result).toStrictEqual({
        step: 'until',
        visible: null,
        response: null,
        file: null,
        predicate: 'true',
        console: null,
        timeoutMs: null,
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: resize} => StepStub builds valid resize default member', () => {
      const result = StepStub({ step: 'resize' });

      expect(result).toStrictEqual({
        step: 'resize',
        width: 1280,
        height: 720,
        node: null,
        expect: 'ok',
      });
    });
  });

  describe('resize member validation', () => {
    it('VALID: {step: resize, width, height} => parses the complete resize member', () => {
      const result = stepContract.parse({
        step: 'resize',
        width: 1920,
        height: 1080,
        node: 'desktop-hd',
        expect: 'ok',
      });

      expect(result).toStrictEqual({
        step: 'resize',
        width: 1920,
        height: 1080,
        node: 'desktop-hd',
        expect: 'ok',
      });
    });

    it('INVALID: {step: resize, width: 0} => throws for non-positive width', () => {
      expect(() =>
        stepContract.parse({
          step: 'resize',
          width: 0,
          height: 720,
        } as never),
      ).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID: {step: resize, width: 1280.5} => throws for non-integer width', () => {
      expect(() =>
        stepContract.parse({
          step: 'resize',
          width: 1280.5,
          height: 720,
        } as never),
      ).toThrow(/Expected integer/u);
    });

    it('INVALID: {step: resize, height: -10} => throws for negative height', () => {
      expect(() =>
        stepContract.parse({
          step: 'resize',
          width: 1280,
          height: -10,
        } as never),
      ).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID: {step: resize, +target} => throws naming the stray key, because resize is strict', () => {
      expect(() =>
        stepContract.parse({
          step: 'resize',
          width: 1280,
          height: 720,
          target: '[data-testid="X"]',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'target'/u);
    });
  });

  describe('request member', () => {
    it('VALID: {step: request, path: "/api/guilds"} => parses with default GET method, null node, and ok expect', () => {
      const result = stepContract.parse({ step: 'request', path: '/api/guilds' });

      expect(result).toStrictEqual({
        step: 'request',
        method: 'GET',
        path: '/api/guilds',
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: request, full options} => parses with custom method, body, headers, node, and expect', () => {
      const result = stepContract.parse({
        step: 'request',
        method: 'POST',
        path: '/api/guilds',
        body: { name: 'guild-1' },
        headers: { 'x-custom': 'val' },
        node: 'create-node',
        expect: 'error',
      });

      expect(result).toStrictEqual({
        step: 'request',
        method: 'POST',
        path: '/api/guilds',
        body: { name: 'guild-1' },
        headers: { 'x-custom': 'val' },
        node: 'create-node',
        expect: 'error',
      });
    });

    it('INVALID: {step: request, missing path} => throws for missing path', () => {
      expect(() =>
        stepContract.parse({
          step: 'request',
        } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {step: request, invalid method} => throws for unlisted method', () => {
      expect(() =>
        stepContract.parse({
          step: 'request',
          path: '/api/guilds',
          method: 'INVALID_METHOD',
        } as never),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {step: request, +target} => throws naming the stray key, because request is strict', () => {
      expect(() =>
        stepContract.parse({
          step: 'request',
          path: '/api/guilds',
          target: '[data-testid="X"]',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'target'/u);
    });
  });

  describe('before member', () => {
    it('VALID: {step: before, source: "..."} => parses with null node and ok expect', () => {
      const result = stepContract.parse({ step: 'before', source: 'window.__injected = true;' });

      expect(result).toStrictEqual({
        step: 'before',
        source: 'window.__injected = true;',
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: before, full options} => parses with custom node and expect', () => {
      const result = stepContract.parse({
        step: 'before',
        source: 'window.__injected = true;',
        node: 'init-script',
        expect: 'error',
      });

      expect(result).toStrictEqual({
        step: 'before',
        source: 'window.__injected = true;',
        node: 'init-script',
        expect: 'error',
      });
    });

    it('VALID: {step: before} => StepStub builds valid before default member', () => {
      const result = StepStub({ step: 'before' });

      expect(result).toStrictEqual({
        step: 'before',
        source: 'window.__injected = true;',
        node: null,
        expect: 'ok',
      });
    });

    it('INVALID: {step: before, missing source} => throws for missing source', () => {
      expect(() =>
        stepContract.parse({
          step: 'before',
        } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {step: before, +target} => throws naming the stray key, because before is strict', () => {
      expect(() =>
        stepContract.parse({
          step: 'before',
          source: 'window.__injected = true;',
          target: '[data-testid="X"]',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'target'/u);
    });
  });

  describe('file member', () => {
    it('VALID: {step: file, path: "..."} => parses with null node and ok expect', () => {
      const result = stepContract.parse({ step: 'file', path: 'guilds/g1/quests/q1/quest.json' });

      expect(result).toStrictEqual({
        step: 'file',
        path: 'guilds/g1/quests/q1/quest.json',
        node: null,
        expect: 'ok',
      });
    });

    it('VALID: {step: file, full options} => parses with custom node and expect', () => {
      const result = stepContract.parse({
        step: 'file',
        path: 'guilds/g1/quests/q1/quest.json',
        node: 'quest-file',
        expect: 'error',
      });

      expect(result).toStrictEqual({
        step: 'file',
        path: 'guilds/g1/quests/q1/quest.json',
        node: 'quest-file',
        expect: 'error',
      });
    });

    it('VALID: {step: file} => StepStub builds valid file default member', () => {
      const result = StepStub({ step: 'file' });

      expect(result).toStrictEqual({
        step: 'file',
        path: 'guilds/g1/quests/q1/quest.json',
        node: null,
        expect: 'ok',
      });
    });

    it('INVALID: {step: file, missing path} => throws for missing path', () => {
      expect(() =>
        stepContract.parse({
          step: 'file',
        } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {step: file, +target} => throws naming the stray key, because file is strict', () => {
      expect(() =>
        stepContract.parse({
          step: 'file',
          path: 'guilds/g1/quests/q1/quest.json',
          target: '[data-testid="X"]',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'target'/u);
    });
  });
});
