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
  StepStub({ step: 'screenshot', name: FileNameStub() }),
  StepStub({ step: 'eval', source: ContentTextStub() }),
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

  describe('the six members, full shape', () => {
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
        timeoutMs: null,
        node: null,
      });

      expect(result).toStrictEqual({
        step: 'click',
        target: '[data-testid="PIXEL_BTN"]',
        within: '[data-testid="GUILD_LIST"]',
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
        value: '<script>alert(1)</script>',
        timeoutMs: null,
        node: null,
        expect: 'error',
      });

      expect(result).toStrictEqual({
        step: 'type',
        target: '[data-testid="CHAT_INPUT"]',
        within: null,
        value: '<script>alert(1)</script>',
        timeoutMs: null,
        node: null,
        expect: 'error',
      });
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

    it('INVALID: {step: click, path, no target} => throws for the missing click field', () => {
      expect(() =>
        stepContract.parse({ step: 'click', path: '/api/guilds', node: null } as never),
      ).toThrow(/Required/u);
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

  describe('an unknown discriminator', () => {
    it('INVALID: {step: "look"} => throws for a verb outside the six-member union', () => {
      expect(() =>
        stepContract.parse({ step: 'look', target: '[data-testid="X"]' } as never),
      ).toThrow(/Invalid discriminator/u);
    });
  });

  describe('the expect default', () => {
    it('EDGE: {expect omitted} => defaults to ok', () => {
      const result = stepContract.parse({ step: 'goto', path: '/api/guilds', node: null });

      expect(result.expect).toBe('ok');
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a click step with no node and the default expectation', () => {
      const result = StepStub();

      expect(result).toStrictEqual({
        step: 'click',
        target: '[data-testid="GUILD_ADD"]',
        within: null,
        timeoutMs: null,
        node: null,
        expect: 'ok',
      });
    });
  });
});
