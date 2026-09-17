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
  });
});
