/**
 * PURPOSE: The recipe-fidelity vocabulary — the three markers in the spec's own order, the one
 * marker that obliges a `mirrors:` pointer, the risk each one declares, and which of them costs a
 * booted instance to prove. Reach for this over retyping the three names anywhere:
 * `recipeFidelityContract` derives its enum from `markers.all`, and `recipeManifestContract` reads
 * `markers.mirrorsRequired` rather than a second `'direct'` literal. `instanceCost` lives HERE and
 * not on each manifest because it is a property of the FIDELITY — a `direct` recipe is pure `fs`
 * and a `production` one calls a real route — so a per-recipe copy would be a second place for the
 * two to disagree.
 *
 * USAGE:
 * recipeFidelityStatics.markers.all;
 * // Returns ['production', 'direct', 'captured']
 *
 * recipeFidelityStatics.risks.direct;
 * // Returns 'it can drift from what production actually writes'
 */

export const recipeFidelityStatics = {
  markers: {
    // siegelense-recipes.md lines 431-435's own order.
    all: ['production', 'direct', 'captured'],
    // `direct` is the only marker declaring a drift risk, so it is the only one that has to name
    // the production writer it copied (siegelense-recipes.md line 282).
    mirrorsRequired: 'direct',
  },
  meanings: {
    production: 'built by calling the real code path, so the server does what it really does',
    direct: 'written straight to disk in the shape production would have made',
    captured: 'recorded from a real run and replayed',
  },
  risks: {
    production: 'none; this is the honest one',
    direct: 'it can drift from what production actually writes',
    captured: 'the only one that cannot lie about shape',
  },
  instanceCost: {
    // Proving a production recipe's claim calls a real route, so a production-fidelity suite shares
    // one booted instance (siegelense-recipes.md line 580). The other two need none at all.
    needing: ['production'],
  },
} as const;
