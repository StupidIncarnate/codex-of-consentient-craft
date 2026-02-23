/**
 * PURPOSE: Renders the home screen content with guild selection and session list inside the shared map frame
 *
 * USAGE:
 * <HomeContentLayerWidget />
 * // Renders guild list sidebar + session list, used as the "/" route content
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Center, Group, Text } from '@mantine/core';

import type { GuildId, GuildName, GuildPath, SessionId } from '@dungeonmaster/shared/contracts';

import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { useSessionListBinding } from '../../bindings/use-session-list/use-session-list-binding';
import { guildCreateBroker } from '../../brokers/guild/create/guild-create-broker';
import type { SessionFilter } from '../../contracts/session-filter/session-filter-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { GuildAddModalWidget } from '../guild-add-modal/guild-add-modal-widget';
import { GuildEmptyStateWidget } from '../guild-empty-state/guild-empty-state-widget';
import { GuildListWidget } from '../guild-list/guild-list-widget';
import { GuildSessionListWidget } from '../guild-session-list/guild-session-list-widget';

type InternalView = 'main' | 'new-guild';

export const HomeContentLayerWidget = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [internalView, setInternalView] = useState<InternalView>('main');
  const [selectedGuildId, setSelectedGuildId] = useState<GuildId | null>(null);
  const [addGuildModalOpened, setAddGuildModalOpened] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('quests-only' as SessionFilter);

  const { guilds, loading: guildsLoading, refresh: refreshGuilds } = useGuildsBinding();
  const { data: sessions, loading: sessionsLoading } = useSessionListBinding({
    guildId: selectedGuildId,
  });

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
        <Group align="stretch" gap="xl" wrap="nowrap" style={{ flex: 1, minHeight: 0 }}>
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
          <Box style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {selectedGuildId ? (
              <GuildSessionListWidget
                sessions={sessions}
                loading={sessionsLoading}
                filter={sessionFilter}
                onFilterChange={({ filter }) => {
                  setSessionFilter(filter);
                }}
                onSelect={({ sessionId }: { sessionId: SessionId }) => {
                  const selectedGuild = guilds.find((guild) => guild.id === selectedGuildId);
                  const slug = selectedGuild?.urlSlug ?? selectedGuildId;
                  const result = navigate(`/${slug}/session/${sessionId}`);
                  if (result instanceof Promise) {
                    result.catch(() => undefined);
                  }
                }}
                onAdd={() => {
                  const selectedGuild = guilds.find((guild) => guild.id === selectedGuildId);
                  const slug = selectedGuild?.urlSlug ?? selectedGuildId;
                  const result = navigate(`/${slug}/session`);
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
