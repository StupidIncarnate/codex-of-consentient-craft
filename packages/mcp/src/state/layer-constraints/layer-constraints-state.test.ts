import { layerConstraintsState } from './layer-constraints-state';
import { layerConstraintsStateProxy } from './layer-constraints-state.proxy';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('layerConstraintsState', () => {
  it('VALID: {content} => stores and retrieves layer constraints content', () => {
    const proxy = layerConstraintsStateProxy();
    proxy.setup();

    const content = ContentTextStub({ value: '## Layer Constraints\n\nTest content' });

    layerConstraintsState.set({ content });
    const result = layerConstraintsState.get();

    expect(result).toBe(content);
  });

  it('VALID: get() with no content set => returns undefined', () => {
    const proxy = layerConstraintsStateProxy();
    proxy.setup();

    const result = layerConstraintsState.get();

    expect(result).toBeUndefined();
  });

  it('VALID: clear() => removes stored content', () => {
    const proxy = layerConstraintsStateProxy();
    proxy.setup();

    const content = ContentTextStub({ value: '## Layer Constraints' });

    layerConstraintsState.set({ content });
    layerConstraintsState.clear();
    const result = layerConstraintsState.get();

    expect(result).toBeUndefined();
  });
});
