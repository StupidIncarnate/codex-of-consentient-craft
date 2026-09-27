/**
 * @jest-environment jsdom
 */
import { MatcherAugmentedStub } from './matcher-augmented.stub';

describe('MatcherAugmentedStub', () => {
  it('VALID: {} => the real jest-dom augmentation lets a real element pass toBeInTheDocument', () => {
    expect(MatcherAugmentedStub()).toBe(true);

    const element = document.createElement('div');
    document.body.appendChild(element);

    expect(element).toBeInTheDocument();
  });
});
