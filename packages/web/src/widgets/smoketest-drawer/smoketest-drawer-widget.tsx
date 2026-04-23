/**
 * PURPOSE: Renders a smoketest results drawer showing progress, currently-running case, and per-case verified/failed rows with prompt, model, and agent chat entries
 *
 * USAGE:
 * <SmoketestDrawerWidget opened={opened} onClose={handleClose} runId={runId} total={total} currentCase={currentCase} results={results} running={running} />
 * // Renders a Mantine Drawer with live progress
 */

import { Drawer, Stack, Text } from '@mantine/core';

import type { SmoketestCaseResult, SmoketestRunId } from '@dungeonmaster/shared/contracts';

import type { TotalCount } from '../../contracts/total-count/total-count-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { ChatEntryListWidget } from '../chat-entry-list/chat-entry-list-widget';

type CurrentCase = {
  caseId: SmoketestCaseResult['caseId'];
  name: SmoketestCaseResult['name'];
} | null;

export const SmoketestDrawerWidget = ({
  opened,
  onClose,
  runId,
  total,
  currentCase,
  results,
  running,
}: {
  opened: boolean;
  onClose: () => void;
  runId: SmoketestRunId | null;
  total: TotalCount | null;
  currentCase: CurrentCase;
  results: readonly SmoketestCaseResult[];
  running: boolean;
}): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const completedCount = results.length;
  const progressLabel = total === null ? `${completedCount}` : `${completedCount}/${total}`;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="lg"
      title="Smoketest Results"
      styles={{
        content: {
          backgroundColor: colors['bg-deep'],
          color: colors.text,
          fontFamily: 'monospace',
        },
        header: {
          backgroundColor: colors['bg-raised'],
          color: colors.text,
          fontFamily: 'monospace',
        },
      }}
    >
      <Stack gap="md" data-testid="SMOKETEST_DRAWER_CONTENT">
        {runId !== null && (
          <Text size="xs" c={colors['text-dim']} data-testid="SMOKETEST_DRAWER_RUN_ID">
            {`runId: ${runId}`}
          </Text>
        )}
        {running || runId !== null ? (
          <Text size="xs" c={running ? colors.warning : colors.success}>
            {running ? `Running… (${progressLabel})` : `Idle (${progressLabel})`}
          </Text>
        ) : null}
        {running && currentCase !== null && (
          <Text size="sm" c={colors.warning} data-testid="SMOKETEST_DRAWER_CURRENT_CASE">
            {`Now: ${currentCase.name}`}
          </Text>
        )}
        {results.map((r) => {
          const resultLabel = r.passed ? 'verified' : 'failed';
          const resultColor = r.passed ? colors.success : colors.danger;
          const detail = r.summary ?? r.errorMessage ?? '';
          const hasEntries = r.entries !== undefined && r.entries.length > 0;
          const showPrompt = r.prompt !== undefined && r.prompt !== '';
          const showModel = r.model !== undefined && r.model !== '';
          const showOutputPre = !hasEntries && r.output !== undefined && r.output !== '';
          return (
            <Stack key={r.caseId} gap={4} data-testid={`SMOKETEST_CASE_${r.caseId.toUpperCase()}`}>
              <Text size="sm" c={resultColor}>
                {`[${resultLabel}] ${r.name}`}
              </Text>
              {detail === '' ? null : (
                <Text size="xs" c={colors['text-dim']} style={{ paddingLeft: 12 }}>
                  {detail}
                </Text>
              )}
              {showModel ? (
                <Text
                  size="xs"
                  c={colors['text-dim']}
                  style={{ paddingLeft: 12 }}
                  data-testid={`SMOKETEST_CASE_MODEL_${r.caseId.toUpperCase()}`}
                >
                  {`model: ${r.model}`}
                </Text>
              ) : null}
              {showPrompt ? (
                <details style={{ paddingLeft: 12 }}>
                  <summary
                    style={{ cursor: 'pointer', color: colors['text-dim'], fontSize: 12 }}
                    data-testid={`SMOKETEST_CASE_PROMPT_TOGGLE_${r.caseId.toUpperCase()}`}
                  >
                    prompt
                  </summary>
                  <Text
                    size="xs"
                    c={colors['text-dim']}
                    component="pre"
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                    }}
                    data-testid={`SMOKETEST_CASE_PROMPT_${r.caseId.toUpperCase()}`}
                  >
                    {r.prompt}
                  </Text>
                </details>
              ) : null}
              {hasEntries ? (
                <div
                  style={{ paddingLeft: 12 }}
                  data-testid={`SMOKETEST_CASE_ENTRIES_${r.caseId.toUpperCase()}`}
                >
                  <ChatEntryListWidget entries={[...(r.entries ?? [])]} isStreaming={false} />
                </div>
              ) : null}
              {showOutputPre ? (
                <Text
                  size="xs"
                  c={colors['text-dim']}
                  component="pre"
                  style={{
                    paddingLeft: 12,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                  }}
                  data-testid={`SMOKETEST_CASE_OUTPUT_${r.caseId.toUpperCase()}`}
                >
                  {r.output}
                </Text>
              ) : null}
            </Stack>
          );
        })}
      </Stack>
    </Drawer>
  );
};
