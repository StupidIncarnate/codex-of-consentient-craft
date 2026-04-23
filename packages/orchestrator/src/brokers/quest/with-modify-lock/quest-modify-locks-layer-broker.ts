/**
 * PURPOSE: Shared mutable Map<QuestId, Promise<void>> used by the per-questId mutex in quest-with-modify-lock-broker
 *
 * USAGE:
 * questModifyLocksLayerBroker.set(questId, promise);
 * questModifyLocksLayerBroker.get(questId);
 * // Treat as internal — delegate via questWithModifyLockBroker
 *
 * WHY-LAYER: brokers/ cannot import from state/. The mutex map lives as a module-scoped singleton
 * inside this broker folder, mediated through this layer file so the main mutex logic and the
 * test reset helper can share the same Map reference.
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

export const questModifyLocksLayerBroker = new Map<QuestId, Promise<void>>();
