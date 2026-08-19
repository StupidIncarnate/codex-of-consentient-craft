/**
 * PURPOSE: Single source of truth for which `HealthSnapshot` fields the `/health` table renders,
 * in what order, under which label, and behind which testids — so the table widget maps over this
 * list instead of hardcoding seven JSX rows, and its test derives the expected testid list from
 * here instead of maintaining a second hardcoded copy.
 *
 * USAGE:
 * healthPageRowsStatics.rows.map((row) => row.rowTestId);
 * // Returns the 7 HEALTH_PAGE_ROW_* testids in render order
 */
export const healthPageRowsStatics = {
  rows: [
    {
      field: 'status',
      label: 'STATUS',
      rowTestId: 'HEALTH_PAGE_ROW_STATUS',
      valueTestId: 'HEALTH_PAGE_VALUE_STATUS',
    },
    {
      field: 'timestamp',
      label: 'TIMESTAMP',
      rowTestId: 'HEALTH_PAGE_ROW_TIMESTAMP',
      valueTestId: 'HEALTH_PAGE_VALUE_TIMESTAMP',
    },
    {
      field: 'uptimeSeconds',
      label: 'UPTIME SECONDS',
      rowTestId: 'HEALTH_PAGE_ROW_UPTIME_SECONDS',
      valueTestId: 'HEALTH_PAGE_VALUE_UPTIME_SECONDS',
    },
    {
      field: 'version',
      label: 'VERSION',
      rowTestId: 'HEALTH_PAGE_ROW_VERSION',
      valueTestId: 'HEALTH_PAGE_VALUE_VERSION',
    },
    {
      field: 'port',
      label: 'PORT',
      rowTestId: 'HEALTH_PAGE_ROW_PORT',
      valueTestId: 'HEALTH_PAGE_VALUE_PORT',
    },
    {
      field: 'home',
      label: 'HOME',
      rowTestId: 'HEALTH_PAGE_ROW_HOME',
      valueTestId: 'HEALTH_PAGE_VALUE_HOME',
    },
    {
      field: 'orchestrationMode',
      label: 'ORCHESTRATION MODE',
      rowTestId: 'HEALTH_PAGE_ROW_ORCHESTRATION_MODE',
      valueTestId: 'HEALTH_PAGE_VALUE_ORCHESTRATION_MODE',
    },
  ],
} as const;
