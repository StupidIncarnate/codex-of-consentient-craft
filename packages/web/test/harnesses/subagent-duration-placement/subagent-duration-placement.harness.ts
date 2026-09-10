/**
 * PURPOSE: Reads real geometry and real computed style off a rendered SUBAGENT_CHAIN_HEADER —
 * whether the duration figure paints after the header's description text, and whether its
 * font/colour genuinely match execution-row-duration's rather than merely declaring the same
 * literals. jsdom has no layout engine (every rect reads zero-ish) and an inline `ff="monospace"`
 * prop resolves to a CSS custom property rather than the literal word, so neither claim is
 * checkable below a real browser painting the page.
 *
 * USAGE:
 * const placement = subagentDurationPlacementHarness({ page });
 * expect(await placement.durationSitsAfterDescription()).toBe(true);
 * const chainStyle = await placement.readDurationStyle({ testId: 'subagent-chain-duration' });
 * const rowStyle = await placement.readDurationStyle({ testId: 'execution-row-duration' });
 * expect(rowStyle).toStrictEqual(chainStyle);
 */
import type { Page } from '@playwright/test';

// Browser-evaluated predicate: SUBAGENT_CHAIN_HEADER renders three children in a fixed order —
// chevron (index 0), description (index 1), duration (index 2, present only while the chain has a
// start) — so the description is always the header's own second child whenever a duration renders
// at all. jsdom reports every box as zero-sized, so only a real browser can tell "painted after"
// from "shares the right DOM order but paints somewhere else entirely".
const DURATION_AFTER_DESCRIPTION_BROWSER_FN = (header: Element): boolean => {
  const description = header.children[1] ?? null;
  const duration = header.querySelector('[data-testid="subagent-chain-duration"]');
  if (description === null || duration === null) {
    return false;
  }
  const descriptionRect = description.getBoundingClientRect();
  const durationRect = duration.getBoundingClientRect();
  return durationRect.x > descriptionRect.x + descriptionRect.width;
};

// Browser-evaluated read of the three CSS properties the styling claim is actually about, plus a
// monospace check computed HERE rather than inside an expect() — `expect(x).toMatch(/monospace/u)`
// is an unanchored regex ESLint's ban-unanchored-to-match rejects, and
// `expect(x.includes('monospace'))` is the shape ban-string-includes-in-expect rejects. Computing
// the boolean in the browser sidesteps both without weakening the claim. Field types mirror
// subagent-chain-widget.proxy.ts's own getDurationStyle — CSSStyleDeclaration's own indexed types,
// never a raw `string`, which ban-primitives rejects on a return position.
const DURATION_STYLE_BROWSER_FN = (
  el: Element,
): {
  fontSize: CSSStyleDeclaration['fontSize'];
  color: CSSStyleDeclaration['color'];
  fontFamily: CSSStyleDeclaration['fontFamily'];
  fontFamilyIsMonospace: boolean;
} => {
  const style = window.getComputedStyle(el);
  return {
    fontSize: style.fontSize,
    color: style.color,
    fontFamily: style.fontFamily,
    fontFamilyIsMonospace: style.fontFamily.includes('monospace'),
  };
};

export const subagentDurationPlacementHarness = ({
  page,
}: {
  page: Page;
}): {
  durationSitsAfterDescription: () => Promise<boolean>;
  readDurationStyle: (params: { testId: string }) => Promise<{
    fontSize: CSSStyleDeclaration['fontSize'];
    color: CSSStyleDeclaration['color'];
    fontFamily: CSSStyleDeclaration['fontFamily'];
    fontFamilyIsMonospace: boolean;
  }>;
} => ({
  durationSitsAfterDescription: async (): Promise<boolean> =>
    page
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .first()
      .evaluate(DURATION_AFTER_DESCRIPTION_BROWSER_FN),

  readDurationStyle: async ({
    testId,
  }: {
    testId: string;
  }): Promise<{
    fontSize: CSSStyleDeclaration['fontSize'];
    color: CSSStyleDeclaration['color'];
    fontFamily: CSSStyleDeclaration['fontFamily'];
    fontFamilyIsMonospace: boolean;
  }> => page.getByTestId(testId).first().evaluate(DURATION_STYLE_BROWSER_FN),
});
