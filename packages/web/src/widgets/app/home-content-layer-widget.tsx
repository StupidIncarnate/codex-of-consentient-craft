/**
 * PURPOSE: Renders the home screen content with guild selection and quest list inside the shared map frame
 *
 * USAGE:
 * <HomeContentLayerWidget />
 * // Renders guild list sidebar + quest list, used as the "/" route content
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Center, Group, Text } from '@mantine/core';

import type { GuildId, GuildName, GuildPath, QuestId } from '@dungeonmaster/shared/contracts';

import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { useQuestsBinding } from '../../bindings/use-quests/use-quests-binding';
import { guildCreateBroker } from '../../brokers/guild/create/guild-create-broker';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { GuildAddModalWidget } from '../guild-add-modal/guild-add-modal-widget';
import { GuildEmptyStateWidget } from '../guild-empty-state/guild-empty-state-widget';
import { GuildListWidget } from '../guild-list/guild-list-widget';
import { GuildQuestListWidget } from '../guild-quest-list/guild-quest-list-widget';

type InternalView = 'main' | 'new-guild';

export const HomeContentLayerWidget = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [internalView, setInternalView] = useState<InternalView>('main');
  const [selectedGuildId, setSelectedGuildId] = useState<GuildId | null>(null);
  const [addGuildModalOpened, setAddGuildModalOpened] = useState(false);

  const { guilds, loading: guildsLoading, refresh: refreshGuilds } = useGuildsBinding();
  const { data: quests } = useQuestsBinding({ guildId: selectedGuildId });

  const { colors } = emberDepthsThemeStatics;
  const hasGuilds = guilds.length > 0;

  return (
    <>
      {(!hasGuilds && !guildsLoading) || internalView === 'new-guild' ? (
        <Center style={{ height: 250 }}>
          <GuildEmptyStateWidget
            onAddGuild={({ name, path }) => {
              guildCreateBroker({ name: String(name), path: String(path) })
                .then(async ({ id }) => {
                  await refreshGuilds();
                  setSelectedGuildId(id);
                  setInternalView('main');
                })
                .catch(() => undefined);
            }}
            onCancel={
              hasGuilds
                ? () => {
                    setInternalView('main');
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
              }}
              onAdd={() => {
                setInternalView('new-guild');
              }}
            />
          </Box>
          <Box style={{ flex: 1 }}>
            {selectedGuildId ? (
              <GuildQuestListWidget
                quests={quests}
                onSelect={({ questId }: { questId: QuestId }) => {
                  const selectedGuild = guilds.find((guild) => guild.id === selectedGuildId);
                  const slug = selectedGuild?.urlSlug ?? selectedGuildId;
                  const result = navigate(`/${slug}/quest/${questId}`);
                  if (result instanceof Promise) {
                    result.catch(() => undefined);
                  }
                }}
                onAdd={() => {
                  const selectedGuild = guilds.find((guild) => guild.id === selectedGuildId);
                  const slug = selectedGuild?.urlSlug ?? selectedGuildId;
                  const result = navigate(`/${slug}/quest`);
                  if (result instanceof Promise) {
                    result.catch(() => undefined);
                  }
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
    </>
  );
};
