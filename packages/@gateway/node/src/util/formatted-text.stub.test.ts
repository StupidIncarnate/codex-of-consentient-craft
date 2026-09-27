import { FormattedTextStub } from './formatted-text.stub';

describe('FormattedTextStub', () => {
  it('VALID: {} => formats the default template into "foo is 42"', () => {
    expect(FormattedTextStub()).toBe('foo is 42');
  });

  it('VALID: {template, args} => formats the given template with the given args', () => {
    expect(FormattedTextStub({ template: '%s has %d items', args: ['cart', 3] })).toBe(
      'cart has 3 items',
    );
  });
});
