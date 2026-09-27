/**
 * @jest-environment jsdom
 */
import { RenderResultStub } from './render-result.stub';

describe('RenderResultStub', () => {
  it('VALID: {} => a real RenderResult whose real container holds the rendered text', () => {
    const result = RenderResultStub();

    expect(result.container.textContent).toBe('gateway-stub');
  });
});
