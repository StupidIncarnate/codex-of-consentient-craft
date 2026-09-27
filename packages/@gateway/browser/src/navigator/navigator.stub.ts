/**
 * PURPOSE: The real `navigator` singleton `#gateway/browser/navigator` passes through — there is
 * nothing to construct beyond it, so this hands back the genuine object rather than a fake one.
 *
 * USAGE:
 * const realNavigator = NavigatorStub();
 * // Returns globalThis.navigator, unchanged
 */
import { navigator } from './navigator';

export const NavigatorStub = (): Navigator => navigator;
