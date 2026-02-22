/**
 * PURPOSE: Attaches agentId to JSONL session entries by scanning user tool_result entries for toolUseResult.agentId and mapping it to matching Task tool_use assistant entries
 *
 * USAGE:
 * attachAgentIdsToEntriesTransformer({ entries });
 * // Mutates entries in place, attaching agentId to assistant entries with Task tool_use and user entries with matching tool_result
 */

export const attachAgentIdsToEntriesTransformer = ({ entries }: { entries: unknown[] }): void => {
  const agentIdMap = new Map();

  for (const e of entries) {
    if (typeof e !== 'object' || e === null) continue;
    if (Reflect.get(e, 'type') !== 'user') continue;
    const toolUseResult: unknown = Reflect.get(e, 'toolUseResult');
    if (typeof toolUseResult !== 'object' || toolUseResult === null) continue;
    const agentId: unknown = Reflect.get(toolUseResult, 'agentId');
    if (typeof agentId !== 'string') continue;
    const message: unknown = Reflect.get(e, 'message');
    if (typeof message !== 'object' || message === null) continue;
    const content: unknown = Reflect.get(message, 'content');
    if (!Array.isArray(content)) continue;
    for (const item of content) {
      if (typeof item !== 'object' || item === null) continue;
      if (Reflect.get(item, 'type') !== 'tool_result') continue;
      const toolUseId: unknown = Reflect.get(item, 'tool_use_id');
      if (typeof toolUseId === 'string') {
        agentIdMap.set(toolUseId, agentId);
      }
    }
  }

  for (const e of entries) {
    if (typeof e !== 'object' || e === null) continue;
    if (Reflect.get(e, 'type') !== 'assistant') continue;
    const message: unknown = Reflect.get(e, 'message');
    if (typeof message !== 'object' || message === null) continue;
    const content: unknown = Reflect.get(message, 'content');
    if (!Array.isArray(content)) continue;
    for (const item of content) {
      if (typeof item !== 'object' || item === null) continue;
      if (Reflect.get(item, 'type') !== 'tool_use') continue;
      if (Reflect.get(item, 'name') !== 'Task') continue;
      const id: unknown = Reflect.get(item, 'id');
      if (typeof id === 'string' && agentIdMap.has(id)) {
        Reflect.set(e, 'agentId', agentIdMap.get(id));
      }
    }
  }

  for (const e of entries) {
    if (typeof e !== 'object' || e === null) continue;
    if (Reflect.get(e, 'type') !== 'user') continue;
    const message: unknown = Reflect.get(e, 'message');
    if (typeof message !== 'object' || message === null) continue;
    const content: unknown = Reflect.get(message, 'content');
    if (!Array.isArray(content)) continue;
    for (const item of content) {
      if (typeof item !== 'object' || item === null) continue;
      if (Reflect.get(item, 'type') !== 'tool_result') continue;
      const toolUseId: unknown = Reflect.get(item, 'tool_use_id');
      if (typeof toolUseId === 'string' && agentIdMap.has(toolUseId)) {
        Reflect.set(e, 'agentId', agentIdMap.get(toolUseId));
      }
    }
  }
};
