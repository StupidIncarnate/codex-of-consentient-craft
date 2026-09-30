/**
 * PURPOSE: Renders the home screen content with guild selection and session list inside the shared map frame
 *
 * USAGE:
 * <HomeContentWidget />
 * // Renders guild list sidebar + session list, used as the "/" route content
 */

import { consoleError } from '#gateway/browser/console';
import { readItem, removeItem, writeItem } from '#gateway/browser/localStorage';
import { useEffect, useState } from '#gateway/npm/react';
import { Link, useNavigate } from '#gateway/npm/react-router-dom';

import { Box, Center, Group, Text } from '#gateway/npm/mantine__core';

import type { GuildName, GuildPath, Quest, Guild, Session } from '@dungeonmaster/shared/contracts';

import { notifications } from '#gateway/npm/mantine__notifications';
import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { useQuestsBinding } from '../../bindings/use-quests/use-quests-binding';
import { useSessionListBinding } from '../../bindings/use-session-list/use-session-list-binding';
import { guildCreateBroker } from '../../brokers/guild/create/guild-create-broker';
import { questDeleteBroker } from '../../brokers/quest/delete/quest-delete-broker';
import type { SessionFilter } from '../../contracts/session-filter/session-filter-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { GuildAddModalWidget } from '../guild-add-modal/guild-add-modal-widget';
import { GuildEmptyStateWidget } from '../guild-empty-state/guild-empty-state-widget';
import { GuildListWidget } from '../guild-list/guild-list-widget';
import { GuildSessionListWidget } from '../guild-session-list/guild-session-list-widget';

type InternalView = 'main' | 'new-guild';

const GUILD_STORAGE_KEY = 'dungeonmaster-last-guild';

export const HomeContentWidget = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [internalView, setInternalView] = useState<InternalView>('main');
  const [selectedGuildId, setSelectedGuildId] = useState<Guild['id'] | null>(() => {
    const stored = readItem({ key: GUILD_STORAGE_KEY });
    return stored ? (stored as Guild['id']) : null;
  });
  const [addGuildModalOpened, setAddGuildModalOpened] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('quests-only' as SessionFilter);

  const { guilds, loading: guildsLoading, refresh: refreshGuilds } = useGuildsBinding();
  const { data: sessions, loading: sessionsLoading } = useSessionListBinding({
    guildId: selectedGuildId,
  });
  const {
    data: questsList,
    skipped: skippedQuestFiles,
    loading: questsLoading,
    refresh: refreshQuests,
  } = useQuestsBinding({
    guildId: selectedGuildId,
  });

  const [confirmingQuestId, setConfirmingQuestId] = useState<Quest['id'] | null>(null);
  const [deletingQuestId, setDeletingQuestId] = useState<Quest['id'] | null>(null);

  useEffect(() => {
    const persisted = selectedGuildId
      ? writeItem({ key: GUILD_STORAGE_KEY, value: selectedGuildId })
      : removeItem({ key: GUILD_STORAGE_KEY });
    if (!persisted.success) {
      consoleError('[home-content] failed to persist the selected guild', persisted.error);
    }
  }, [selectedGuildId]);

  useEffect(() => {
    if (guildsLoading) return;
    if (selectedGuildId && !guilds.some((g) => g.id === selectedGuildId)) {
      setSelectedGuildId(null);
    }
  }, [guilds, guildsLoading, selectedGuildId]);

  // One toast per distinct set of unreadable quest files. The list request itself succeeds, so
  // this is the only moment the user is actively told; the unreadable rows below carry it after.
  const skippedQuestFilesSignature = skippedQuestFiles
    .map((skippedQuestFile) => String(skippedQuestFile.questFolder))
    .join(',');

  useEffect(() => {
    if (skippedQuestFilesSignature === '') return;
    const skippedCount = skippedQuestFilesSignature.split(',').length;
    notifications.show({
      message: `${skippedCount} quest file${skippedCount === 1 ? '' : 's'} could not be read — see the unreadable rows in the quest list`,
      color: 'red',
    });
  }, [skippedQuestFilesSignature]);

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
                .catch((createError: unknown) => {
                  consoleError('[home-content] guild create failed', createError);
                });
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
              onSelect={({ id }: { id: Guild['id'] }) => {
                setSelectedGuildId(id);
              }}
              onAdd={() => {
                setInternalView('new-guild');
              }}
            />
            <Link
              to="/queue"
              data-testid="HOME_QUEUE_LINK"
              style={{
                display: 'block',
                marginTop: 16,
                padding: '4px 12px',
                fontFamily: 'monospace',
                fontSize: 11,
                textAlign: 'center',
                textDecoration: 'none',
                color: colors.text,
                backgroundColor: colors['bg-raised'],
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
              }}
            >
              ⚔ EXECUTION QUEUE
            </Link>
          </Box>
          <Box style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {selectedGuildId ? (
              <GuildSessionListWidget
                sessions={sessions}
                quests={questsList}
                skippedQuestFiles={skippedQuestFiles}
                loading={sessionFilter === 'quests-only' ? questsLoading : sessionsLoading}
                filter={sessionFilter}
                onFilterChange={({ filter }) => {
                  setSessionFilter(filter);
                }}
                onSelect={({ sessionId }: { sessionId: Session['id'] }) => {
                  const selectedGuild = guilds.find((guild) => guild.id === selectedGuildId);
                  const slug = selectedGuild?.urlSlug ?? selectedGuildId;
                  const session = sessions.find((s) => s.sessionId === sessionId);
                  const target =
                    session?.questId === undefined
                      ? `/${slug}/session/${sessionId}`
                      : `/${slug}/quest/${session.questId}`;
                  const result = navigate(target, {
                    state: { questId: session?.questId ?? null },
                  });
                  if (result instanceof Promise) {
                    result.catch((navError: unknown) => {
                      consoleError('[home-content] navigation failed', navError);
                    });
                  }
                }}
                onSelectQuest={({ questId }: { questId: Quest['id'] }) => {
                  const selectedGuild = guilds.find((guild) => guild.id === selectedGuildId);
                  const slug = selectedGuild?.urlSlug ?? selectedGuildId;
                  const result = navigate(`/${slug}/quest/${String(questId)}`, {
                    state: { questId },
                  });
                  if (result instanceof Promise) {
                    result.catch((navError: unknown) => {
                      consoleError('[home-content] navigation failed', navError);
                    });
                  }
                }}
                onAdd={() => {
                  const selectedGuild = guilds.find((guild) => guild.id === selectedGuildId);
                  const slug = selectedGuild?.urlSlug ?? selectedGuildId;
                  const result = navigate(`/${slug}/quest`);
                  if (result instanceof Promise) {
                    result.catch((navError: unknown) => {
                      consoleError('[home-content] navigation failed', navError);
                    });
                  }
                }}
                confirmingQuestId={confirmingQuestId}
                onConfirmingQuestIdChange={({ questId }) => {
                  setConfirmingQuestId(questId);
                }}
                deletingQuestId={deletingQuestId}
                onDeleteQuest={({ questId }: { questId: Quest['id'] }) => {
                  setDeletingQuestId(questId);
                  questDeleteBroker({ questId, guildId: selectedGuildId })
                    .then(async () => {
                      await refreshQuests();
                      setConfirmingQuestId(null);
                      setDeletingQuestId(null);
                    })
                    .catch((deleteError: unknown) => {
                      const message =
                        deleteError instanceof Error && deleteError.message
                          ? deleteError.message
                          : 'Failed to delete quest';
                      notifications.show({ message, color: 'red' });
                      setConfirmingQuestId(null);
                      setDeletingQuestId(null);
                    });
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
            .catch((createError: unknown) => {
              consoleError('[home-content] guild create failed', createError);
            });
        }}
      />
    </>
  );
};
