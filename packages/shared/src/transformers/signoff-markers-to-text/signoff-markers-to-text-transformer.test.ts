import { SignoffStub } from '../../contracts/signoff/signoff.stub';
import { signoffMarkersToTextTransformer } from './signoff-markers-to-text-transformer';

describe('signoffMarkersToTextTransformer', () => {
  describe('one track signed', () => {
    it('VALID: {codeweaver confirmed} => renders the codeweaver mark alone', () => {
      const result = signoffMarkersToTextTransformer({
        codeweaverSignoff: SignoffStub(),
        flowriderSignoff: undefined,
        siegemasterSignoff: undefined,
      });

      expect(result).toBe(' [C✓]');
    });

    it('VALID: {flowrider confirmed} => renders the flowrider mark alone', () => {
      const result = signoffMarkersToTextTransformer({
        codeweaverSignoff: undefined,
        flowriderSignoff: SignoffStub(),
        siegemasterSignoff: undefined,
      });

      expect(result).toBe(' [F✓]');
    });

    it('VALID: {siegemaster confirmed} => renders the siegemaster mark alone', () => {
      const result = signoffMarkersToTextTransformer({
        codeweaverSignoff: undefined,
        flowriderSignoff: undefined,
        siegemasterSignoff: SignoffStub(),
      });

      expect(result).toBe(' [S✓]');
    });
  });

  describe('several tracks signed', () => {
    it('VALID: {flowrider and siegemaster confirmed} => renders both marks, flowrider first', () => {
      const result = signoffMarkersToTextTransformer({
        codeweaverSignoff: undefined,
        flowriderSignoff: SignoffStub(),
        siegemasterSignoff: SignoffStub(),
      });

      expect(result).toBe(' [F✓ S✓]');
    });

    it('VALID: {every track confirmed} => renders all three marks in relay order', () => {
      const result = signoffMarkersToTextTransformer({
        codeweaverSignoff: SignoffStub(),
        flowriderSignoff: SignoffStub(),
        siegemasterSignoff: SignoffStub(),
      });

      expect(result).toBe(' [C✓ F✓ S✓]');
    });

    it('VALID: {flowrider confirmed, siegemaster unconfirmable} => renders a verdict per track', () => {
      const result = signoffMarkersToTextTransformer({
        codeweaverSignoff: undefined,
        flowriderSignoff: SignoffStub(),
        siegemasterSignoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'the dev server refuses to bind port 3737 in this sandbox',
          toSettle: 'Start the sandbox dev server on the configured port, then re-walk this node.',
        }),
      });

      expect(result).toBe(' [F✓ S?]');
    });
  });

  describe('unconfirmable verdicts', () => {
    it('VALID: {flowrider unconfirmable} => renders the question mark, never the evidence text', () => {
      const result = signoffMarkersToTextTransformer({
        codeweaverSignoff: undefined,
        flowriderSignoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'playwright.config.ts declares no webServer for this project',
          toSettle:
            'Add a webServer block to playwright.config.ts, then re-run this spec against it.',
        }),
        siegemasterSignoff: undefined,
      });

      expect(result).toBe(' [F?]');
    });

    it('VALID: {codeweaver unconfirmable} => renders the question mark on the codeweaver column', () => {
      const result = signoffMarkersToTextTransformer({
        codeweaverSignoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'the observable names a value only the running server produces',
          toSettle: 'Assert this at the unit boundary that needs no live server.',
        }),
        flowriderSignoff: undefined,
        siegemasterSignoff: undefined,
      });

      expect(result).toBe(' [C?]');
    });

    it('VALID: {both unconfirmable} => renders both question marks', () => {
      const result = signoffMarkersToTextTransformer({
        codeweaverSignoff: undefined,
        flowriderSignoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'no webServer is declared for the e2e run',
          toSettle: 'Add a webServer block to playwright.config.ts.',
        }),
        siegemasterSignoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'the dev server refuses to bind port 3737 in this sandbox',
          toSettle: 'Start the sandbox dev server on the configured port, then re-walk this node.',
        }),
      });

      expect(result).toBe(' [F? S?]');
    });
  });

  describe('no track signed', () => {
    it('EMPTY: {no sign-offs} => renders the empty string, so an unsigned line is unchanged', () => {
      const result = signoffMarkersToTextTransformer({
        codeweaverSignoff: undefined,
        flowriderSignoff: undefined,
        siegemasterSignoff: undefined,
      });

      expect(result).toBe('');
    });

    it('EMPTY: {no sign-offs} => concatenating the marker leaves the line byte-identical', () => {
      const marker = signoffMarkersToTextTransformer({
        codeweaverSignoff: undefined,
        flowriderSignoff: undefined,
        siegemasterSignoff: undefined,
      });

      expect(`[#login-page] Login Page (state)${marker}`).toBe('[#login-page] Login Page (state)');
    });
  });
});
