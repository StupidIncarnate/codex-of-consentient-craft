/**
 * @jest-environment jsdom
 *
 * `.integration.test.ts`, not `.test.ts`: loading `@testing-library/jest-dom` for real trips the
 * unit-test I/O trap (ward's `unit` check refuses a file that reaches outside the process at
 * import time). `jest-dom` adds no exports of its own — it only registers matchers on the global
 * `expect` — so the proof is that a matcher it defines actually works after importing this
 * gateway module, not an export-keys comparison.
 */
import './testing-library__jest-dom';

describe('#gateway/npm/testing-library__jest-dom', () => {
  it('VALID: {a real DOM element} => registers the toBeInTheDocument matcher', () => {
    document.body.innerHTML = '<div data-testid="PRESENT"></div>';
    const element = document.querySelector('[data-testid="PRESENT"]');

    expect(element).toBeInTheDocument();
  });
});
