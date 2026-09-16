/**
 * PURPOSE: The top-level chain entries every call-site fixture in this directory opens with — `dm`
 * over the FILE-backed ingredient set, `blog` over the DATABASE-backed one. Reach for this instead
 * of calling `entryChainTransformer` again in each fixture: the registry (which sibling keys exist)
 * is what the child-accessor rows in this directory are actually about, so every fixture must see
 * the identical one. Carries no deliberate error itself, exactly like `../dm-target.ts` and
 * `declaration/_shared.ts`: a mistake here would contaminate every fixture's diagnostic count
 * rather than staying isolated to one file.
 *
 * USAGE:
 * import { dm, blog } from './_shared';
 */
import { entryChainTransformer } from '../../../src/transformers/entry-chain/entry-chain-transformer';
import {
  guildIngredient,
  questIngredient,
  operationIngredient,
  sessionIngredient,
} from '../dm-target';
import { userIngredient, postIngredient, commentIngredient } from '../sql-target';

export const dm = entryChainTransformer({
  registry: {
    guilds: guildIngredient,
    quests: questIngredient,
    operations: operationIngredient,
    sessions: sessionIngredient,
  },
});

export const blog = entryChainTransformer({
  registry: {
    users: userIngredient,
    posts: postIngredient,
    comments: commentIngredient,
  },
});
