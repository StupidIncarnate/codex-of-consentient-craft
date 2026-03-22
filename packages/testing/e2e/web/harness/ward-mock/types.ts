export interface WardResponse {
  exitCode?: number;
  runId?: string;
  outputLines?: string[];
  wardResultJson?: Record<string, unknown>;
}
