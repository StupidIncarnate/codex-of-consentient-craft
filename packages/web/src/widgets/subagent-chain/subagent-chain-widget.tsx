/**
 * PURPOSE: Renders a collapsible sub-agent chain with header showing description and entry count
 *
 * USAGE:
 * <SubagentChainWidget group={subagentChainGroup} isStreaming={false} />
 * // Renders collapsed chain header, expands to show inner tool groups and messages
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';
import { ToolGroupWidget } from '../tool-group/tool-group-widget';

export interface SubagentChainWidgetProps {
  group: ChatEntryGroup;
  isStreaming: boolean;
}

export const SubagentChainWidget = ({
  group,
  isStreaming,
}: SubagentChainWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  const [expanded, setExpanded] = useState(false);

  if (group.kind !== 'subagent-chain') return null;

  const chevron = expanded ? '\u25BE' : '\u25B8';

  return (
    <Box>
      <Box
        data-testid="SUBAGENT_CHAIN_HEADER"
        onClick={() => {
          setExpanded((prev) => !prev);
        }}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={600}
          style={{
            color: colors['loot-rare'],
            padding: '1px 4px',
            borderRadius: 2,
          }}
        >
          {chevron} SUB-AGENT
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
          &quot;{group.description}&quot; ({String(group.entryCount)} entries)
        </Text>
      </Box>

      {expanded ? (
        <Box style={{ paddingLeft: 12, borderLeft: `2px solid ${colors['loot-rare']}` }}>
          {group.innerGroups.map((innerGroup, index) => {
            if (innerGroup.kind === 'tool-group') {
              return (
                <ToolGroupWidget
                  key={`inner-${String(index)}`}
                  group={innerGroup}
                  isLastGroup={false}
                  isStreaming={isStreaming}
                />
              );
            }

            return (
              <ChatMessageWidget
                key={`inner-${String(index)}`}
                entry={innerGroup.entry}
                isStreaming={isStreaming}
              />
            );
          })}
          {group.taskNotification === null ? null : (
            <ChatMessageWidget entry={group.taskNotification} isStreaming={isStreaming} />
          )}
        </Box>
      ) : null}
    </Box>
  );
};
