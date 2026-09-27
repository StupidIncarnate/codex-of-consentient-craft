/**
 * @jest-environment jsdom
 */
import { createElement, act } from 'react';
import { RootStub } from './root.stub';

describe('RootStub', () => {
  it('VALID: {container} => a real Root that renders real content into the given container', () => {
    const container = document.createElement('div');
    const root = RootStub({ container });

    act(() => {
      root.render(createElement('div', null, 'gateway-stub'));
    });

    expect(container.textContent).toBe('gateway-stub');
  });
});
