/**
 * PURPOSE: Displays a grid of agent execution slots with status badges
 *
 * USAGE:
 * <SlotGridWidget slots={[{slotId: 0, status: 'running', step: 'Create user model'}]} />
 * // Renders a grid of cards showing each slot's ID, status, and current step
 */

import { Badge, Card, SimpleGrid, Text } from '@mantine/core';

import type { OrchestrationStatus } from '@dungeonmaster/shared/contracts';

import { questStatusColorsStatics } from '../../statics/quest-status-colors/quest-status-colors-statics';

export interface SlotGridWidgetProps {
  slots: OrchestrationStatus['slots'];
}

export const SlotGridWidget = ({ slots }: SlotGridWidgetProps): React.JSX.Element => {
  const { slotStatus } = questStatusColorsStatics;

  if (slots.length === 0) {
    return (
      <Text c="dimmed" data-testid="SLOT_GRID_EMPTY">
        No active slots
      </Text>
    );
  }

  return (
    <SimpleGrid cols={3} data-testid="SLOT_GRID">
      {slots.map((slot) => {
        const statusKey = slot.status === 'running' ? 'running' : 'idle';
        const color = slotStatus[statusKey];

        return (
          <Card
            key={slot.slotId}
            padding="sm"
            withBorder
            data-testid={`SLOT_CARD_${String(slot.slotId)}`}
          >
            <Text fw={600} data-testid={`SLOT_ID_${String(slot.slotId)}`}>
              Slot {String(slot.slotId)}
            </Text>
            <Badge color={color} data-testid={`SLOT_STATUS_${String(slot.slotId)}`}>
              {slot.status}
            </Badge>
            {slot.step !== undefined && (
              <Text size="sm" c="dimmed" data-testid={`SLOT_STEP_${String(slot.slotId)}`}>
                {slot.step}
              </Text>
            )}
          </Card>
        );
      })}
    </SimpleGrid>
  );
};
