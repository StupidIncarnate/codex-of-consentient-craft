/**
 * PURPOSE: Defines the four kinds of atomic verification unit a quest flow decomposes into
 *
 * USAGE:
 * qaChecklistKindContract.parse('observable');
 * // Returns: QaChecklistKind enum value
 *
 * A `terminal` is a node with no outgoing edges (success or error/skip alike); a `branch` is one
 * labelled edge out of a decision node; an `observable` is one FlowObservable embedded in a node;
 * an `off-map` unit is a probe family the graph never draws. Every unit carries its own
 * `flowriderSignoff` and `siegemasterSignoff`, so coverage is counted rather than remembered.
 */

import { z } from 'zod';

export const qaChecklistKindContract = z.enum(['terminal', 'branch', 'observable', 'off-map']);

export type QaChecklistKind = z.infer<typeof qaChecklistKindContract>;
