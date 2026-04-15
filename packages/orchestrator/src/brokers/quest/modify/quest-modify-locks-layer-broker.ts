/**
 * PURPOSE: Shared mutable Map<QuestId, Promise<void>> used by the per-questId mutex in with-quest-modify-lock-layer-broker
 *
 * USAGE:
 * questModifyLocksLayerBroker.set(questId, promise);
 * questModifyLocksLayerBroker.get(questId);
 * // Treat as internal — delegate via withQuestModifyLockLayerBroker
 *
 * WHY-LAYER: brokers/ cannot import from state/. The mutex map lives as a module-scoped singleton
 * inside the modify broker folder, mediated through this layer file so the main mutex logic
 * and the test reset helper can share the same Map reference.
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

export const questModifyLocksLayerBroker = new Map<QuestId, Promise<void>>();
