/**
 * PURPOSE: Replaces every `{binding.field}` in a step with the id a `seed` step earlier in this
 * batch bound under that name — "a seed mints runtime ids that no file contains, so later steps
 * must be able to reference them without a round trip to the model" (siegelense-tooling.md line
 * 2801). Reach for this on EVERY step, not only the ones you expect to carry one: a placeholder can
 * be anywhere a string is, and a `goto` path, a `within` scope, an `eval` source and a recipe
 * parameter are all equally worth an id.
 *
 * An unresolvable placeholder THROWS `SeedBindingUnknownError` rather than passing through. A
 * `{g.guildSlug}` that survived as a literal becomes a `goto` to a nonsense URL and a NO MATCH
 * three steps later, which is the worst place to learn about a typo; a refusal naming the binding
 * and listing what IS bound is answerable on the spot.
 *
 * Substitution runs over the step's JSON TEXT rather than over a walk of its fields, so it reaches
 * every string a step can hold — including the top-level recipe parameters the `seed` member keeps
 * as catchall keys, which a typed walk would have to know about separately. Each replacement is
 * JSON-escaped on the way in, so an id carrying a quote or a backslash cannot break the document
 * it lands in. The result is re-parsed through `stepContract`, so an interpolated step is branded
 * and validated exactly like a typed one.
 *
 * USAGE:
 * stepInterpolateTransformer({
 *   step: StepStub({ step: 'goto', path: '/{g.guildSlug}' }),
 *   bindings: SeedBindingsStub(),
 * });
 * // Returns the same step with its path reading '/siege-guild'
 */

import type { SeedBindings } from '../../contracts/seed-bindings/seed-bindings-contract';
import { stepContract } from '../../contracts/step/step-contract';
import type { Step } from '../../contracts/step/step-contract';
import { SeedBindingUnknownError } from '../../errors/seed-binding-unknown/seed-binding-unknown-error';
import { seedPlaceholderStatics } from '../../statics/seed-placeholder/seed-placeholder-statics';

export const stepInterpolateTransformer = ({
  step,
  bindings,
}: {
  step: Step;
  bindings: SeedBindings;
}): Step => {
  const stepToSerialise =
    step.step === 'goto' && typeof step.path === 'object'
      ? {
          ...step,
          path: `{${String(step.path.step)}.${String(step.path.row)}.${String(step.path.field)}}`,
        }
      : step;

  const serialised = JSON.stringify(stepToSerialise);

  // A step holding no placeholder comes back as the object it went in as, so nothing re-parses a
  // shape zod already validated — and an `eval` source full of braces is never even considered.
  if (!new RegExp(seedPlaceholderStatics.pattern.source, 'u').test(serialised)) {
    return step;
  }

  const substituted = serialised.replace(
    new RegExp(seedPlaceholderStatics.pattern.source, 'gu'),
    (placeholder, binding: string, field: string) => {
      const bound = Object.entries(bindings).find(([name]) => name === binding)?.[1];
      if (bound === undefined) {
        throw new SeedBindingUnknownError({
          placeholder,
          binding,
          knownBindings: Object.keys(bindings),
          knownFields: null,
        });
      }

      const value = Object.entries(bound).find(([name]) => name === field)?.[1];
      if (value === undefined) {
        throw new SeedBindingUnknownError({
          placeholder,
          binding,
          knownBindings: Object.keys(bindings),
          knownFields: Object.keys(bound),
        });
      }

      // Escaped as a JSON string and stripped of its own quotes, so an id carrying a `"` or a `\`
      // lands inside the surrounding JSON string rather than terminating it.
      return JSON.stringify(value).slice(1, -1);
    },
  );

  return stepContract.parse(JSON.parse(substituted));
};
