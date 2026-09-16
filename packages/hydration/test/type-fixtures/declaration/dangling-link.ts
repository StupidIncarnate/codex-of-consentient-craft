/**
 * D9 — a `links.of` naming an ingredient the registry does not hold fires at the REGISTRY, not at
 * the declaration. This ingredient's OWN declaration is well-formed: `ingredientDeclareBroker`
 * never checks a link's `of` against a registry (`IngredientConfig.links` types `of` as bare
 * `string`, deliberately, so an ingredient never depends on its parents' names existing before it
 * does). The dangling reference only becomes visible once something inverts a NAMED SET of
 * ingredients — `registryCreateBroker`'s phantom-property intersection is what refuses the call
 * below. `RegistryDanglingLinkError` is the runtime counterpart, for a caller that reaches
 * `registryCreateBroker` from plain JavaScript and never typechecked at all.
 *
 * Counterpart: `scrolls/seigelense/proto/declarations.ts`'s `danglingLink`, which builds the same
 * shape and marks `registry({ orphans: linksNowhere })` `@ts-expect-error nothing in this registry
 * is named 'no-such-ingredient'`.
 */
import { dmIngredient, sampleFields, sampleRecordContract, write } from './_shared';
import { registryCreateBroker } from '../../../src/brokers/registry/create/registry-create-broker';

export const orphanIngredient = dmIngredient({
  name: 'orphan',
  description: 'a row linking to an ingredient no registry will ever hold',
  fields: sampleFields,
  record: sampleRecordContract,
  // `as: 'title'` names a REAL field — D8 already covers a bad `as`. The only thing wrong with
  // this link is `of`, which no registry will ever hold.
  links: [{ of: 'no-such-ingredient', as: 'title' }],
  routes: { write },
  copies: 'x',
});

export const danglingLink = registryCreateBroker({ orphans: orphanIngredient });
