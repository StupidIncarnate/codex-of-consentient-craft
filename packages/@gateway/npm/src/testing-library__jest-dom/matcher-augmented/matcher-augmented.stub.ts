/**
 * PURPOSE: `@testing-library/jest-dom` exports no runtime value — its only real effect is a bare
 * `import '@testing-library/jest-dom';` that augments Jest's `expect` with DOM matchers globally,
 * which is also why this subpath's own barrel is `.integration.test.ts`, not `.test.ts` (loading
 * the real package trips the unit-test I/O trap). This stub is thin for the same reason: its whole
 * job IS that side-effect import, so its own companion test is `.stub.integration.test.ts` too,
 * and calls the real, now-augmented matcher itself (an `expect()` call belongs in a test file, not
 * here).
 *
 * USAGE:
 * import { MatcherAugmentedStub } from './matcher-augmented.stub';
 * MatcherAugmentedStub();
 * // Augments the real, global `expect` with jest-dom's own matchers, e.g. toBeInTheDocument
 */
import '@testing-library/jest-dom';

export const MatcherAugmentedStub = (): true => true;
