/**
 * PURPOSE: The `health` step's page-side source generation and Node-side translation — generating the
 * script that inspects the page DOM for the presence of the root element (`#root`), and translating
 * the raw evaluation result into a boolean.
 *
 * USAGE:
 * const rootCheck = rootCheckTransformer();
 * const source = rootCheck.checkSource();
 * const raw = await page.evaluate(source);
 * const isPresent = rootCheck.toResult({ raw });
 */

import { healthStatics } from '../../statics/health/health-statics';

export const rootCheckTransformer = (): {
  checkSource: () => string;
  toResult: (params: { raw: unknown }) => boolean;
} => ({
  checkSource: (): string =>
    `Boolean(document.querySelector(${JSON.stringify(healthStatics.selectors.root)}))`,

  toResult: ({ raw }: { raw: unknown }): boolean => Boolean(raw),
});
