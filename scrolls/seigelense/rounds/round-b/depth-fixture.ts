// Round B (chunk 12), B1/B2 — nest the synthetic a..h chain one level at a time and let the
// compiler grade each depth. Every export below must compile clean (zero diagnostics) for the
// depth it names; a depth where the accessor vanishes or the compiler throws TS2589 is the finding.
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import {
  aIngredient,
  bIngredient,
  cIngredient,
  dIngredient,
  eIngredient,
  fIngredient,
  gIngredient,
  hIngredient,
  iIngredient,
  jIngredient,
  kIngredient,
  lIngredient,
  labelContract,
} from './deep-ingredients';

const dm = entryChainTransformer({
  registry: {
    as: aIngredient,
    bs: bIngredient,
    cs: cIngredient,
    ds: dIngredient,
    es: eIngredient,
    fs: fIngredient,
    gs: gIngredient,
    hs: hIngredient,
    is: iIngredient,
    js: jIngredient,
    ks: kIngredient,
    ls: lIngredient,
  },
});

// depth 3 — the proven shape (guild -> quest -> operation is 3 levels), as a control.
export const depth3 = dm.as.add(1, (a) => [
  a[0].bs.add(1, (b) => [
    b[0].cs.add(1, (c) => [c[0].set({ label: labelContract.parse('depth three') })]),
  ]),
]);

// depth 4 — B1.
export const depth4 = dm.as.add(1, (a) => [
  a[0].bs.add(1, (b) => [
    b[0].cs.add(1, (c) => [
      c[0].ds.add(1, (d) => [d[0].set({ label: labelContract.parse('depth four') })]),
    ]),
  ]),
]);

// depth 5 — B2, first step past what B1 asks for.
export const depth5 = dm.as.add(1, (a) => [
  a[0].bs.add(1, (b) => [
    b[0].cs.add(1, (c) => [
      c[0].ds.add(1, (d) => [
        d[0].es.add(1, (e) => [e[0].set({ label: labelContract.parse('depth five') })]),
      ]),
    ]),
  ]),
]);

// depth 6.
export const depth6 = dm.as.add(1, (a) => [
  a[0].bs.add(1, (b) => [
    b[0].cs.add(1, (c) => [
      c[0].ds.add(1, (d) => [
        d[0].es.add(1, (e) => [
          e[0].fs.add(1, (f) => [f[0].set({ label: labelContract.parse('depth six') })]),
        ]),
      ]),
    ]),
  ]),
]);

// depth 7.
export const depth7 = dm.as.add(1, (a) => [
  a[0].bs.add(1, (b) => [
    b[0].cs.add(1, (c) => [
      c[0].ds.add(1, (d) => [
        d[0].es.add(1, (e) => [
          e[0].fs.add(1, (f) => [
            f[0].gs.add(1, (g) => [g[0].set({ label: labelContract.parse('depth seven') })]),
          ]),
        ]),
      ]),
    ]),
  ]),
]);

// depth 8 — as deep as this fixture's own chain goes.
export const depth8 = dm.as.add(1, (a) => [
  a[0].bs.add(1, (b) => [
    b[0].cs.add(1, (c) => [
      c[0].ds.add(1, (d) => [
        d[0].es.add(1, (e) => [
          e[0].fs.add(1, (f) => [
            f[0].gs.add(1, (g) => [
              g[0].hs.add(1, (h) => [h[0].set({ label: labelContract.parse('depth eight') })]),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]),
]);

// depth 12 — a bigger jump, to check the mechanism scales past a small handful of levels.
export const depth12 = dm.as.add(1, (a) => [
  a[0].bs.add(1, (b) => [
    b[0].cs.add(1, (c) => [
      c[0].ds.add(1, (d) => [
        d[0].es.add(1, (e) => [
          e[0].fs.add(1, (f) => [
            f[0].gs.add(1, (g) => [
              g[0].hs.add(1, (h) => [
                h[0].is.add(1, (i) => [
                  i[0].js.add(1, (j) => [
                    j[0].ks.add(1, (k) => [
                      k[0].ls.add(1, (l) => [
                        l[0].set({ label: labelContract.parse('depth twelve') }),
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]),
]);
