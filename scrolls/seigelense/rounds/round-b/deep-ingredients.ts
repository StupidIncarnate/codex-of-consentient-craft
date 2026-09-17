// Round B (chunk 12) scratch fixture — B1/B2. A SYNTHETIC registry, eight levels deep (a..h), each
// linking only to its immediate parent, mirroring dm-target.ts's own `dmIngredient` wrapper so the
// depth tests exercise the SAME generic machinery a real ingredient does, not a loosened stand-in.
import { z } from 'zod';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import type {
  IngredientConfig,
  IngredientConfigInferenceAnchor,
  Ingredient,
  ExtrasFree,
} from '../../packages/hydration/src/contracts/ingredient-config/ingredient-config-contract';
import type { CopiesFor } from '../../packages/hydration/src/contracts/hydration-routes/hydration-routes-contract';

const deepHomeContract = z.string().brand<'DeepHome'>();

export interface DeepTarget {
  home: z.infer<typeof deepHomeContract>;
}

const dmIngredient = <TFields extends object, const C extends IngredientConfig<DeepTarget, TFields>>(
  config: C &
    IngredientConfigInferenceAnchor<TFields> &
    CopiesFor<C['routes']> & { extras?: ExtrasFree<C['extras']> },
): Ingredient<C> => ingredientDeclareBroker<DeepTarget, TFields, C['name'], C>(config);

declare const write: (args: {
  target: DeepTarget;
  fields: Record<string, unknown>;
}) => Promise<unknown>;

export const labelContract = z.string().brand<'Label'>();

// ------------------------------------------------- level a — top, no links

const aIdContract = z.string().brand<'AId'>();
const aFieldsContract = z.object({ label: labelContract });
type AFields = z.infer<typeof aFieldsContract>;
const aFields: z.ZodType<AFields, z.ZodTypeDef, z.input<typeof aFieldsContract>> = aFieldsContract;

export const aIngredient = dmIngredient({
  name: 'a',
  description: 'level one, no ancestor',
  fields: aFields,
  record: z.object({ id: aIdContract }),
  routes: { write: async ({ target, fields }) => write({ target, fields }) },
  copies: 'x',
});

// ------------------------------------------------- level b — links to a

const bIdContract = z.string().brand<'BId'>();
const bFieldsContract = z.object({ label: labelContract, aId: aIdContract });
type BFields = z.infer<typeof bFieldsContract>;
const bFields: z.ZodType<BFields, z.ZodTypeDef, z.input<typeof bFieldsContract>> = bFieldsContract;

export const bIngredient = dmIngredient({
  name: 'b',
  description: 'level two, links to a',
  fields: bFields,
  record: z.object({ id: bIdContract }),
  links: [{ of: 'a', as: 'aId' }],
  routes: { write: async ({ target, fields }) => write({ target, fields }) },
  copies: 'x',
});

// ------------------------------------------------- level c — links to b

const cIdContract = z.string().brand<'CId'>();
const cFieldsContract = z.object({ label: labelContract, bId: bIdContract });
type CFields = z.infer<typeof cFieldsContract>;
const cFields: z.ZodType<CFields, z.ZodTypeDef, z.input<typeof cFieldsContract>> = cFieldsContract;

export const cIngredient = dmIngredient({
  name: 'c',
  description: 'level three, links to b',
  fields: cFields,
  record: z.object({ id: cIdContract }),
  links: [{ of: 'b', as: 'bId' }],
  routes: { write: async ({ target, fields }) => write({ target, fields }) },
  copies: 'x',
});

// ------------------------------------------------- level d — links to c

const dIdContract = z.string().brand<'DId'>();
const dFieldsContract = z.object({ label: labelContract, cId: cIdContract });
type DFields = z.infer<typeof dFieldsContract>;
const dFields: z.ZodType<DFields, z.ZodTypeDef, z.input<typeof dFieldsContract>> = dFieldsContract;

export const dIngredient = dmIngredient({
  name: 'd',
  description: 'level four, links to c',
  fields: dFields,
  record: z.object({ id: dIdContract }),
  links: [{ of: 'c', as: 'cId' }],
  routes: { write: async ({ target, fields }) => write({ target, fields }) },
  copies: 'x',
});

// ------------------------------------------------- level e — links to d

const eIdContract = z.string().brand<'EId'>();
const eFieldsContract = z.object({ label: labelContract, dId: dIdContract });
type EFields = z.infer<typeof eFieldsContract>;
const eFields: z.ZodType<EFields, z.ZodTypeDef, z.input<typeof eFieldsContract>> = eFieldsContract;

export const eIngredient = dmIngredient({
  name: 'e',
  description: 'level five, links to d',
  fields: eFields,
  record: z.object({ id: eIdContract }),
  links: [{ of: 'd', as: 'dId' }],
  routes: { write: async ({ target, fields }) => write({ target, fields }) },
  copies: 'x',
});

// ------------------------------------------------- level f — links to e

const fIdContract = z.string().brand<'FId'>();
const fFieldsContract = z.object({ label: labelContract, eId: eIdContract });
type FFields = z.infer<typeof fFieldsContract>;
const fFields: z.ZodType<FFields, z.ZodTypeDef, z.input<typeof fFieldsContract>> = fFieldsContract;

export const fIngredient = dmIngredient({
  name: 'f',
  description: 'level six, links to e',
  fields: fFields,
  record: z.object({ id: fIdContract }),
  links: [{ of: 'e', as: 'eId' }],
  routes: { write: async ({ target, fields }) => write({ target, fields }) },
  copies: 'x',
});

// ------------------------------------------------- level g — links to f

const gIdContract = z.string().brand<'GId'>();
const gFieldsContract = z.object({ label: labelContract, fId: fIdContract });
type GFields = z.infer<typeof gFieldsContract>;
const gFields: z.ZodType<GFields, z.ZodTypeDef, z.input<typeof gFieldsContract>> = gFieldsContract;

export const gIngredient = dmIngredient({
  name: 'g',
  description: 'level seven, links to f',
  fields: gFields,
  record: z.object({ id: gIdContract }),
  links: [{ of: 'f', as: 'fId' }],
  routes: { write: async ({ target, fields }) => write({ target, fields }) },
  copies: 'x',
});

// ------------------------------------------------- level h — links to g

const hIdContract = z.string().brand<'HId'>();
const hFieldsContract = z.object({ label: labelContract, gId: gIdContract });
type HFields = z.infer<typeof hFieldsContract>;
const hFields: z.ZodType<HFields, z.ZodTypeDef, z.input<typeof hFieldsContract>> = hFieldsContract;

export const hIngredient = dmIngredient({
  name: 'h',
  description: 'level eight, links to g',
  fields: hFields,
  record: z.object({ id: hIdContract }),
  links: [{ of: 'g', as: 'gId' }],
  routes: { write: async ({ target, fields }) => write({ target, fields }) },
  copies: 'x',
});

// ------------------------------------------------- level i — links to h

const iIdContract = z.string().brand<'IId'>();
const iFieldsContract = z.object({ label: labelContract, hId: hIdContract });
type IFields = z.infer<typeof iFieldsContract>;
const iFields: z.ZodType<IFields, z.ZodTypeDef, z.input<typeof iFieldsContract>> = iFieldsContract;

export const iIngredient = dmIngredient({
  name: 'i',
  description: 'level nine, links to h',
  fields: iFields,
  record: z.object({ id: iIdContract }),
  links: [{ of: 'h', as: 'hId' }],
  routes: { write: async ({ target, fields }) => write({ target, fields }) },
  copies: 'x',
});

// ------------------------------------------------- level j — links to i

const jIdContract = z.string().brand<'JId'>();
const jFieldsContract = z.object({ label: labelContract, iId: iIdContract });
type JFields = z.infer<typeof jFieldsContract>;
const jFields: z.ZodType<JFields, z.ZodTypeDef, z.input<typeof jFieldsContract>> = jFieldsContract;

export const jIngredient = dmIngredient({
  name: 'j',
  description: 'level ten, links to i',
  fields: jFields,
  record: z.object({ id: jIdContract }),
  links: [{ of: 'i', as: 'iId' }],
  routes: { write: async ({ target, fields }) => write({ target, fields }) },
  copies: 'x',
});

// ------------------------------------------------- level k — links to j

const kIdContract = z.string().brand<'KId'>();
const kFieldsContract = z.object({ label: labelContract, jId: jIdContract });
type KFields = z.infer<typeof kFieldsContract>;
const kFields: z.ZodType<KFields, z.ZodTypeDef, z.input<typeof kFieldsContract>> = kFieldsContract;

export const kIngredient = dmIngredient({
  name: 'k',
  description: 'level eleven, links to j',
  fields: kFields,
  record: z.object({ id: kIdContract }),
  links: [{ of: 'j', as: 'jId' }],
  routes: { write: async ({ target, fields }) => write({ target, fields }) },
  copies: 'x',
});

// ------------------------------------------------- level l — links to k

const lIdContract = z.string().brand<'LId'>();
const lFieldsContract = z.object({ label: labelContract, kId: kIdContract });
type LFields = z.infer<typeof lFieldsContract>;
const lFields: z.ZodType<LFields, z.ZodTypeDef, z.input<typeof lFieldsContract>> = lFieldsContract;

export const lIngredient = dmIngredient({
  name: 'l',
  description: 'level twelve, links to k',
  fields: lFields,
  record: z.object({ id: lIdContract }),
  links: [{ of: 'k', as: 'kId' }],
  routes: { write: async ({ target, fields }) => write({ target, fields }) },
  copies: 'x',
});
