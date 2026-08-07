import { SignoffStub } from '../../contracts/signoff/signoff.stub';
import { signoffMarkersToTextTransformer } from './signoff-markers-to-text-transformer';

describe('signoffMarkersToTextTransformer', () => {
  describe('one track signed', () => {
    it('VALID: {flowrider confirmed} => renders the flowrider mark alone', () => {
      const result = signoffMarkersToTextTransformer({
        flowriderSignoff: SignoffStub(),
        siegemasterSignoff: undefined,
      });

      expect(result).toBe(' [F✓]');
    });

    it('VALID: {siegemaster confirmed} => renders the siegemaster mark alone', () => {
      const result = signoffMarkersToTextTransformer({
        flowriderSignoff: undefined,
        siegemasterSignoff: SignoffStub(),
      });

      expect(result).toBe(' [S✓]');
    });
  });

  describe('both tracks signed', () => {
    it('VALID: {both confirmed} => renders both marks, flowrider first', () => {
      const result = signoffMarkersToTextTransformer({
        flowriderSignoff: SignoffStub(),
        siegemasterSignoff: SignoffStub(),
      });

      expect(result).toBe(' [F✓ S✓]');
    });

    it('VALID: {flowrider confirmed, siegemaster unconfirmable} => renders a verdict per track', () => {
      const result = signoffMarkersToTextTransformer({
        flowriderSignoff: SignoffStub(),
        siegemasterSignoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'the dev server refuses to bind port 3737 in this sandbox',
          question: 'Which port should the sandbox dev server use?',
        }),
      });

      expect(result).toBe(' [F✓ S?]');
    });
  });

  describe('unconfirmable verdicts', () => {
    it('VALID: {flowrider unconfirmable} => renders the question mark, never the evidence text', () => {
      const result = signoffMarkersToTextTransformer({
        flowriderSignoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'playwright.config.ts declares no webServer for this project',
          question: 'Who owns adding a webServer block to playwright.config.ts?',
        }),
        siegemasterSignoff: undefined,
      });

      expect(result).toBe(' [F?]');
    });

    it('VALID: {both unconfirmable} => renders both question marks', () => {
      const result = signoffMarkersToTextTransformer({
        flowriderSignoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'no webServer is declared for the e2e run',
          question: 'Who owns adding a webServer block?',
        }),
        siegemasterSignoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'the dev server refuses to bind port 3737 in this sandbox',
          question: 'Which port should the sandbox dev server use?',
        }),
      });

      expect(result).toBe(' [F? S?]');
    });
  });

  describe('neither track signed', () => {
    it('EMPTY: {no sign-offs} => renders the empty string, so an unsigned line is unchanged', () => {
      const result = signoffMarkersToTextTransformer({
        flowriderSignoff: undefined,
        siegemasterSignoff: undefined,
      });

      expect(result).toBe('');
    });

    it('EMPTY: {no sign-offs} => concatenating the marker leaves the line byte-identical', () => {
      const marker = signoffMarkersToTextTransformer({
        flowriderSignoff: undefined,
        siegemasterSignoff: undefined,
      });

      expect(`[#login-page] Login Page (state)${marker}`).toBe('[#login-page] Login Page (state)');
    });
  });
});
