/**
 * PURPOSE: Turns a package's KIND into the colour its chip is drawn in, and answers for the tag
 * whose kind the quest never declared. It exists as a transformer rather than a lookup at the call
 * site because `statics/` may not import `contracts/`, so the branded PackageType and the palette
 * map can only meet here — and because every chip surface (node card, assertion card) must resolve
 * the same way or a node and its assertions would disagree about the same package.
 *
 * USAGE:
 * packageChipAccentTransformer({ packageType: packageTypeContract.parse('frontend-react') });
 * // Returns the orange token every e2e-eligible package's chip wears
 * packageChipAccentTransformer({});
 * // Returns the unresolved token, for a tag naming a package the quest never declared
 */

import type { PackageType } from '@dungeonmaster/shared/contracts';

import { cssColorOverrideContract } from '../../contracts/css-color-override/css-color-override-contract';
import type { CssColorOverride } from '../../contracts/css-color-override/css-color-override-contract';
import { packageTypeStyleStatics } from '../../statics/package-type-style/package-type-style-statics';

export const packageChipAccentTransformer = ({
  packageType,
}: {
  packageType?: PackageType;
}): CssColorOverride => {
  // Matched over the map's entries rather than indexed by the branded value: `PackageType` carries
  // zod's phantom brand, which TypeScript refuses as an index into the literal-keyed statics. The
  // unresolved token is also the answer for a kind that reaches here with no colour of its own, so a
  // chip is always painted — a kind nobody assigned reads as unresolved rather than as a crash.
  const matched = Object.entries(packageTypeStyleStatics.accent).find(
    ([kind]) => kind === String(packageType),
  );
  return cssColorOverrideContract.parse(matched?.[1] ?? packageTypeStyleStatics.unresolved);
};
