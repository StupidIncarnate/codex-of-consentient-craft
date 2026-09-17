import { refRegistryLayerAdapter } from './ref-registry-layer-adapter';
import { refRegistryLayerAdapterProxy } from './ref-registry-layer-adapter.proxy';

describe('refRegistryLayerAdapter', () => {
  describe('initScriptSource()', () => {
    it('VALID: {no arguments} => installs the registry array on the page global', () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const source = registry.initScriptSource();

      expect(source).toBe(
        [
          '(() => {',
          '  const existing = window.__siege;',
          '  if (existing === undefined) {',
          '    window.__siege = { refs: [] };',
          '    return;',
          '  }',
          '  if (Array.isArray(existing.refs) === false) {',
          '    existing.refs = [];',
          '  }',
          '})()',
        ].join('\n'),
      );
    });

    it('VALID: {the source} => reads no element through querySelector, which silently returns match one', () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const singularQueryAt = registry.initScriptSource().indexOf('querySelector(');

      expect(singularQueryAt).toBe(-1);
    });
  });

  describe('refStateSource()', () => {
    it('VALID: {ref: 23} => reads index 22, because a ref is index + 1', () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const source = registry.refStateSource({ ref: 23 });

      expect(source).toBe(
        [
          '(() => {',
          '  const registry = window.__siege === undefined ? null : window.__siege.refs;',
          "  if (registry === null || registry === undefined) { return 'out-of-range'; }",
          '  const element = registry[22];',
          "  if (element === undefined || element === null) { return 'out-of-range'; }",
          "  return element.isConnected === true ? 'live' : 'detached';",
          '})()',
        ].join('\n'),
      );
    });
  });

  describe('stampSource()', () => {
    it('VALID: {ref: 1} => clears any earlier stamp, then marks index 0 so exactly one element carries it', () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const source = registry.stampSource({ ref: 1 });

      expect(source).toBe(
        [
          '(() => {',
          "  document.querySelectorAll('[siege-target]').forEach((stamped) => { stamped.removeAttribute('siege-target'); });",
          '  const registry = window.__siege === undefined ? null : window.__siege.refs;',
          '  if (registry === null || registry === undefined) { return false; }',
          '  const element = registry[0];',
          '  if (element === undefined || element === null || element.isConnected !== true) { return false; }',
          "  element.setAttribute('siege-target', '');",
          '  return true;',
          '})()',
        ].join('\n'),
      );
    });

    it('VALID: {the source} => stamps through querySelectorAll, never the singular form that returns match one', () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const singularQueryAt = registry.stampSource({ ref: 1 }).indexOf('querySelector(');

      expect(singularQueryAt).toBe(-1);
    });
  });

  describe('unstampSource()', () => {
    it('VALID: {no arguments} => removes every stamp, so the mutation never outlives the step that made it', () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const source = registry.unstampSource();

      expect(source).toBe(
        [
          '(() => {',
          "  document.querySelectorAll('[siege-target]').forEach((stamped) => { stamped.removeAttribute('siege-target'); });",
          '  return true;',
          '})()',
        ].join('\n'),
      );
    });
  });

  describe('targetSelector()', () => {
    it('VALID: {no arguments} => the attribute selector a strict locator resolves against', () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const selector = registry.targetSelector();

      expect(selector).toBe('[siege-target]');
    });
  });

  describe('toResolution()', () => {
    it("VALID: {raw: 'live'} => resolves, with no boundary crossed", () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const result = registry.toResolution({ raw: 'live', ref: 23, highestMinted: 41 });

      expect(result).toStrictEqual({ state: 'live', boundary: null, highestMinted: 41 });
    });

    it("VALID: {raw: 'detached'} => stale, naming the detached boundary, never a different element", () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const result = registry.toResolution({ raw: 'detached', ref: 23, highestMinted: 41 });

      expect(result).toStrictEqual({ state: 'stale', boundary: 'detached', highestMinted: 41 });
    });

    it('VALID: {out-of-range, a ref this instance DID mint} => stale, naming the navigation that emptied the registry', () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const result = registry.toResolution({ raw: 'out-of-range', ref: 23, highestMinted: 41 });

      expect(result).toStrictEqual({ state: 'stale', boundary: 'navigation', highestMinted: 41 });
    });

    it('VALID: {out-of-range, a ref beyond anything this instance minted} => unknown, which is the cross-instance case', () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const result = registry.toResolution({ raw: 'out-of-range', ref: 99, highestMinted: 41 });

      expect(result).toStrictEqual({ state: 'unknown', boundary: null, highestMinted: 41 });
    });

    it('EDGE: {out-of-range, nothing ever minted here} => unknown, because a look has never run on this instance', () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const result = registry.toResolution({ raw: 'out-of-range', ref: 1, highestMinted: 0 });

      expect(result).toStrictEqual({ state: 'unknown', boundary: null, highestMinted: 0 });
    });

    it('EDGE: {the ref exactly equal to highestMinted, out of range} => stale, because that ref WAS minted here', () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      const result = registry.toResolution({ raw: 'out-of-range', ref: 41, highestMinted: 41 });

      expect(result).toStrictEqual({ state: 'stale', boundary: 'navigation', highestMinted: 41 });
    });

    it('ERROR: {raw: an unrecognised page answer} => throws rather than guessing which fate it was', () => {
      refRegistryLayerAdapterProxy();
      const registry = refRegistryLayerAdapter();

      expect(() => registry.toResolution({ raw: 'maybe', ref: 1, highestMinted: 1 })).toThrow(
        /Invalid enum value/u,
      );
    });
  });
});
