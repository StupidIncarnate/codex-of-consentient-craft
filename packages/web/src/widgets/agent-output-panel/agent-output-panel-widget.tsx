/**
 * PURPOSE: Displays terminal-like output for agent execution with ANSI color parsing
 *
 * USAGE:
 * <AgentOutputPanelWidget slotIndex={slotId} lines={outputLines} />
 * // Renders a dark terminal panel with monospace output and line count badge
 */

import { Badge, Box, ScrollArea, Text } from '@mantine/core';
import Ansi from 'ansi-to-react';

import type { AgentOutputLine } from '../../contracts/agent-output-line/agent-output-line-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import { agentOutputConfigStatics } from '../../statics/agent-output-config/agent-output-config-statics';

export interface AgentOutputPanelWidgetProps {
  slotIndex: SlotIndex;
  lines: AgentOutputLine[];
}

export const AgentOutputPanelWidget = ({
  slotIndex,
  lines,
}: AgentOutputPanelWidgetProps): React.JSX.Element => {
  const { terminal, limits } = agentOutputConfigStatics;
  const isNearLimit = lines.length >= limits.warningThreshold;

  return (
    <Box data-testid={`AGENT_OUTPUT_PANEL_${String(slotIndex)}`}>
      <Text
        component="div"
        fw={600}
        mb="xs"
        data-testid={`AGENT_OUTPUT_HEADER_${String(slotIndex)}`}
      >
        Slot {String(slotIndex)}
        <Badge
          ml="sm"
          color={isNearLimit ? 'yellow' : 'gray'}
          data-testid={`AGENT_OUTPUT_LINE_COUNT_${String(slotIndex)}`}
        >
          {String(lines.length)} / {String(limits.maxLinesPerSlot)}
        </Badge>
      </Text>
      <ScrollArea
        h={300}
        style={{
          backgroundColor: terminal.backgroundColor,
          borderRadius: 4,
        }}
        data-testid={`AGENT_OUTPUT_SCROLL_${String(slotIndex)}`}
      >
        <Box
          p="sm"
          style={{
            fontFamily: terminal.fontFamily,
            color: terminal.textColor,
            fontSize: 13,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {lines.map((line, index) => (
            <div
              key={index}
              data-testid={`AGENT_OUTPUT_LINE_${String(slotIndex)}_${String(index)}`}
            >
              <Ansi>{line}</Ansi>
            </div>
          ))}
        </Box>
      </ScrollArea>
    </Box>
  );
};
