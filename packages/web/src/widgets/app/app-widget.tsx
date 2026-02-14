/**
 * PURPOSE: Root application layout managing guild selection, quest list, and quest detail views
 *
 * USAGE:
 * <AppWidget />
 * // Renders the full Dungeonmaster web UI with guild list, quest views, and guild management
 */

import { useState } from 'react';

import { Box, Center, Group, Stack, Text } from '@mantine/core';

import type { GuildId, GuildName, GuildPath, QuestId } from '@dungeonmaster/shared/contracts';

import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { useQuestsBinding } from '../../bindings/use-quests/use-quests-binding';
import { guildCreateBroker } from '../../brokers/guild/create/guild-create-broker';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { GuildAddModalWidget } from '../guild-add-modal/guild-add-modal-widget';
import { GuildEmptyStateWidget } from '../guild-empty-state/guild-empty-state-widget';
import { GuildListWidget } from '../guild-list/guild-list-widget';
import { GuildQuestListWidget } from '../guild-quest-list/guild-quest-list-widget';
import { LogoWidget } from '../logo/logo-widget';
import { MapFrameWidget } from '../map-frame/map-frame-widget';
import { QuestChatWidget } from '../quest-chat/quest-chat-widget';

type View = 'main' | 'new-guild' | 'detail';

export const AppWidget = (): React.JSX.Element => {
  const [currentView, setCurrentView] = useState<View>('main');
  const [selectedGuildId, setSelectedGuildId] = useState<GuildId | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<QuestId | null>(null);
  const [addGuildModalOpened, setAddGuildModalOpened] = useState(false);

  const { guilds, loading: guildsLoading, refresh: refreshGuilds } = useGuildsBinding();

  const { data: quests, refresh } = useQuestsBinding({ guildId: selectedGuildId });

  const { colors } = emberDepthsThemeStatics;
  const hasGuilds = guilds.length > 0;

  if (currentView === 'detail' && selectedQuestId) {
    return (
      <QuestChatWidget
        questId={selectedQuestId}
        onBack={() => {
          setCurrentView('main');
          setSelectedQuestId(null);
          refresh().catch(() => undefined);
        }}
      />
    );
  }

  return (
    <div style={{ background: colors['bg-deep'], color: colors.text, minHeight: '100vh' }}>
      <Center h="100vh">
        <Stack align="center" gap="md" w="100%" maw={800} px="md">
          <LogoWidget />
          <MapFrameWidget>
            {(!hasGuilds && !guildsLoading) || currentView === 'new-guild' ? (
              <Center style={{ height: 250 }}>
                <GuildEmptyStateWidget
                  onAddGuild={({ name, path }) => {
                    guildCreateBroker({ name: String(name), path: String(path) })
                      .then(async ({ id }) => {
                        await refreshGuilds();
                        setSelectedGuildId(id);
                        setCurrentView('main');
                      })
                      .catch(() => undefined);
                  }}
                  onCancel={
                    hasGuilds
                      ? () => {
                          setCurrentView('main');
                        }
                      : undefined
                  }
                />
              </Center>
            ) : (
              <Group align="stretch" gap="xl" wrap="nowrap" style={{ flex: 1 }}>
                <Box
                  style={{
                    flex: '0 0 200px',
                    borderRight: `1px solid ${colors.border}`,
                    paddingRight: 16,
                  }}
                >
                  <GuildListWidget
                    guilds={guilds}
                    selectedGuildId={selectedGuildId}
                    onSelect={({ id }: { id: GuildId }) => {
                      setSelectedGuildId(id);
                      setSelectedQuestId(null);
                    }}
                    onAdd={() => {
                      setCurrentView('new-guild');
                    }}
                  />
                </Box>
                <Box style={{ flex: 1 }}>
                  {selectedGuildId ? (
                    <GuildQuestListWidget
                      quests={quests}
                      onSelect={({ questId }: { questId: QuestId }) => {
                        setSelectedQuestId(questId);
                        setCurrentView('detail');
                      }}
                      onAdd={() => {
                        refresh().catch(() => undefined);
                      }}
                    />
                  ) : (
                    <Center h={200}>
                      <Text ff="monospace" size="sm" style={{ color: colors['text-dim'] }}>
                        Select a guild
                      </Text>
                    </Center>
                  )}
                </Box>
              </Group>
            )}
          </MapFrameWidget>
        </Stack>
      </Center>

      <GuildAddModalWidget
        opened={addGuildModalOpened}
        onClose={() => {
          setAddGuildModalOpened(false);
        }}
        onSubmit={({ name, path }: { name: GuildName; path: GuildPath }) => {
          guildCreateBroker({ name: String(name), path: String(path) })
            .then(async ({ id }) => {
              setAddGuildModalOpened(false);
              await refreshGuilds();
              setSelectedGuildId(id);
            })
            .catch(() => undefined);
        }}
      />
    </div>
  );
};
