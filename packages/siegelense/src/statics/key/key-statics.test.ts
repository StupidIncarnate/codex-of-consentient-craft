import { keyStatics } from './key-statics';

describe('keyStatics', () => {
  describe('flags.all', () => {
    it('VALID: flags.all => matches siegelense-tooling.md lines 417-437 in table order', () => {
      expect(keyStatics.flags.all).toStrictEqual([
        'disabled',
        'aria-disabled',
        'focused',
        'selected',
        'checked',
        'expanded',
        'busy',
        'invalid',
        'live',
        'alert',
        'status',
        'aria-hidden',
        'invisible-opacity-0',
        'offscreen',
        'scrollable',
        'covered',
        'clipped-x',
        'clipped-y',
        'cut-no-ellipsis',
        'low-contrast',
        'collapsed-ancestor',
        'empty',
        'not-tabbable',
        'broken-image',
      ]);
    });

    it('VALID: flags.all => carries no className flag, because a class is a mechanism and never a condition', () => {
      const classFlags = keyStatics.flags.all.filter((flag) =>
        flag.toLowerCase().includes('class'),
      );

      expect(classFlags).toStrictEqual([]);
    });

    it('VALID: flags.all => carries no listener flag, because React delegates to the root', () => {
      const listenerFlags = keyStatics.flags.all.filter((flag) =>
        flag.toLowerCase().includes('listener'),
      );

      expect(listenerFlags).toStrictEqual([]);
    });
  });

  describe('excluded.tags', () => {
    it('VALID: excluded.tags => exactly the seven the spec names at line 573', () => {
      expect(keyStatics.excluded.tags).toStrictEqual([
        'style',
        'script',
        'meta',
        'link',
        'title',
        'head',
        'noscript',
      ]);
    });
  });

  describe('attrs', () => {
    it('VALID: attrs.allowed => exactly the five rows of the table at 461-467, with href first', () => {
      expect(keyStatics.attrs.allowed).toStrictEqual([
        'href',
        'maxlength',
        'pattern',
        'required',
        'type',
        'title',
      ]);
    });

    it('VALID: attrs.allowed => className is absent, and re-adding it fails this test rather than passing review', () => {
      const classAttrs = keyStatics.attrs.allowed.filter((attr) =>
        attr.toLowerCase().includes('class'),
      );

      expect(classAttrs).toStrictEqual([]);
    });

    it('VALID: attrs.neverRepeated => holds data-testid, which the element column already carries', () => {
      expect(keyStatics.attrs.neverRepeated).toStrictEqual(['data-testid']);
    });

    it('VALID: {a uuid value} => matches the runtime-id pattern', () => {
      const pattern = new RegExp(
        keyStatics.attrs.runtimeIdPattern.source,
        keyStatics.attrs.runtimeIdPattern.flags,
      );

      expect(pattern.test('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
    });

    it('VALID: {a React useId value} => matches the runtime-id pattern', () => {
      const pattern = new RegExp(
        keyStatics.attrs.runtimeIdPattern.source,
        keyStatics.attrs.runtimeIdPattern.flags,
      );

      expect(pattern.test(':r3:')).toBe(true);
    });

    it('VALID: {a declared status word} => does NOT match the runtime-id pattern', () => {
      const pattern = new RegExp(
        keyStatics.attrs.runtimeIdPattern.source,
        keyStatics.attrs.runtimeIdPattern.flags,
      );

      expect(pattern.test('failed')).toBe(false);
    });

    it('VALID: {a short slug} => does NOT match the runtime-id pattern', () => {
      const pattern = new RegExp(
        keyStatics.attrs.runtimeIdPattern.source,
        keyStatics.attrs.runtimeIdPattern.flags,
      );

      expect(pattern.test('guild-alpha')).toBe(false);
    });

    it('VALID: {a Mantine per-mount id} => matches the generated-id pattern, because it differs between two readings of the same state', () => {
      const pattern = new RegExp(
        keyStatics.attrs.generatedIdPattern.source,
        keyStatics.attrs.generatedIdPattern.flags,
      );

      expect(pattern.test('mantine-gwrqe5vg6-label')).toBe(true);
    });

    it('VALID: {a second Mantine per-mount id} => matches too, with digits interleaved differently', () => {
      const pattern = new RegExp(
        keyStatics.attrs.generatedIdPattern.source,
        keyStatics.attrs.generatedIdPattern.flags,
      );

      expect(pattern.test('mantine-nsg303p87-label')).toBe(true);
    });

    it("VALID: {an app's own indexed id} => does NOT match, because a trailing counter is stable", () => {
      const pattern = new RegExp(
        keyStatics.attrs.generatedIdPattern.source,
        keyStatics.attrs.generatedIdPattern.flags,
      );

      expect(pattern.test('EXECUTION_ROW_0')).toBe(false);
    });

    it('VALID: {a hyphenated row id} => does NOT match', () => {
      const pattern = new RegExp(
        keyStatics.attrs.generatedIdPattern.source,
        keyStatics.attrs.generatedIdPattern.flags,
      );

      expect(pattern.test('quest-row-2')).toBe(false);
    });

    it('VALID: {a plain word id} => does NOT match', () => {
      const pattern = new RegExp(
        keyStatics.attrs.generatedIdPattern.source,
        keyStatics.attrs.generatedIdPattern.flags,
      );

      expect(pattern.test('main-content')).toBe(false);
    });

    it('VALID: {root} => does NOT match, so a stable app id still reaches the element column', () => {
      const pattern = new RegExp(
        keyStatics.attrs.generatedIdPattern.source,
        keyStatics.attrs.generatedIdPattern.flags,
      );

      expect(pattern.test('root')).toBe(false);
    });
  });

  describe('the rest of the shape', () => {
    it('VALID: limits => matches the expected object', () => {
      expect(keyStatics.limits).toStrictEqual({
        maxRows: 200,
        maxDepth: 12,
        textChars: 80,
        attrsPerRow: 4,
        attrValueChars: 40,
      });
    });

    it('VALID: arrows => the compact link form and the new-tab glyph', () => {
      expect(keyStatics.arrows).toStrictEqual({ link: '→', newTab: '↗' });
    });

    it('VALID: rows.fieldTags => only the three whose value is a reading, so a button never reports a bare empty string', () => {
      expect(keyStatics.rows.fieldTags).toStrictEqual(['input', 'textarea', 'select']);
    });

    it('VALID: naming.ladder => the four rungs in spec order', () => {
      expect(keyStatics.naming.ladder).toStrictEqual(['own-text', 'attributes', 'scope', 'nth']);
    });

    it('VALID: naming.attributes => the six the ladder tries when an element paints no words', () => {
      expect(keyStatics.naming.attributes).toStrictEqual([
        'aria-label',
        'title',
        'alt',
        'placeholder',
        'value',
        'name',
      ]);
    });

    it('VALID: contrast.threshold => 3, WCAG AA large-text floor', () => {
      expect(keyStatics.contrast.threshold).toBe(3);
    });
  });
});
