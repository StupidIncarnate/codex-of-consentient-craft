/**
 * PURPOSE: Turns every attribute one element declares into the short attrs column a key row can
 * afford — the allow-list, the compact `→ /path` link form, the determinism guard, the value
 * truncation and the per-row cap (siegelense-tooling.md lines 452-491). Reach for this over doing
 * the selection inside the page-side reader: the reader runs once per page inside a
 * `page.evaluate`, where nothing is testable without a browser, while the budget is the part that
 * decides what a reading CONTAINS and therefore the part a test has to be able to pin.
 *
 * Two exclusions are silent and one is reported, and the difference is deliberate:
 *
 * - An attribute outside the allow-list — `className` above all — is not dropped, it was never a
 *   candidate. A class is the MECHANISM behind something a person sees rather than the thing itself,
 *   and putting it on every row invites a walk to settle a unit on it (line 480).
 * - A value that LOOKS like a runtime id is excluded by policy, and silently. A framework mints one
 *   per mount, so a key carrying one differs between two readings of the same state, which makes the
 *   element delta churn on a page nothing touched (line 474). Counting those as drops would make
 *   every row of a React page claim it dropped something.
 * - Overflow past the cap IS reported, through `dropped`, because a reading that quietly stops is
 *   the `count: 0` problem wearing a different hat (line 469).
 *
 * `target` is read and never emitted: it exists only to put the `↗` glyph on a link, because a click
 * that opens a tab breaks a walk (line 413).
 *
 * USAGE:
 * attrsBudgetTransformer({ attributes: [AttrPairStub({ name: 'href', value: '/queue' })] });
 * // Returns { kept: [{ name: 'href', value: '→ /queue' }], dropped: 0 }
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { attrPairContract } from '../../contracts/attr-pair/attr-pair-contract';
import type { AttrPair } from '../../contracts/attr-pair/attr-pair-contract';
import { readingCountContract } from '../../contracts/reading-count/reading-count-contract';
import type { ReadingCount } from '../../contracts/reading-count/reading-count-contract';
import { keyStatics } from '../../statics/key/key-statics';

export const attrsBudgetTransformer = ({
  attributes,
}: {
  attributes: readonly AttrPair[];
}): { kept: readonly AttrPair[]; dropped: ReadingCount } => {
  const runtimeIdPattern = new RegExp(
    keyStatics.attrs.runtimeIdPattern.source,
    keyStatics.attrs.runtimeIdPattern.flags,
  );
  const opensNewTab = attributes.some(
    (attribute) => attribute.name === 'target' && attribute.value === '_blank',
  );

  const candidates = attributes
    .filter((attribute) => {
      const isAllowedName = keyStatics.attrs.allowed.some((name) => name === attribute.name);
      const isDataAttr = attribute.name.startsWith(keyStatics.attrs.dataPrefix);
      const isNeverRepeated = keyStatics.attrs.neverRepeated.some(
        (name) => name === attribute.name,
      );
      return (isAllowedName || isDataAttr) && !isNeverRepeated;
    })
    .filter((attribute) => !runtimeIdPattern.test(attribute.value))
    .map((attribute) => {
      const truncated =
        attribute.value.length > keyStatics.limits.attrValueChars
          ? `${attribute.value.slice(0, keyStatics.limits.attrValueChars)}…`
          : attribute.value;
      const rendered =
        attribute.name === 'href'
          ? `${keyStatics.arrows.link} ${truncated}${opensNewTab ? ` ${keyStatics.arrows.newTab}` : ''}`
          : truncated;
      return attrPairContract.parse({
        name: contentTextContract.parse(attribute.name),
        value: contentTextContract.parse(rendered),
      });
    });

  return {
    kept: candidates.slice(0, keyStatics.limits.attrsPerRow),
    dropped: readingCountContract.parse(
      Math.max(candidates.length - keyStatics.limits.attrsPerRow, 0),
    ),
  };
};
