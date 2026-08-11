/**
 * PURPOSE: Holds the process's ONE queue registry for the quest-modify mutex. Every serialization
 * guarantee in `questWithModifyLockBroker` rests on there being exactly one of these in the
 * process — a second module-scoped map anywhere is two writers that never see each other.
 *
 * USAGE:
 * questModifyLocksLayerBroker.set(questId, promise);
 * questModifyLocksLayerBroker.get(questId);
 * // Treat as internal — delegate via questWithModifyLockBroker
 *
 * WHY-LAYER: brokers/ cannot import from state/. The map lives as a module-scoped singleton inside
 * this broker folder, mediated through this layer file so the mutex logic and the test reset helper
 * share the same reference. Being a layer file is also what keeps it single: nothing outside this
 * folder may import it, so any other domain needing the lock must come through the entry broker.
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

export const questModifyLocksLayerBroker = new Map<QuestId, Promise<void>>();
