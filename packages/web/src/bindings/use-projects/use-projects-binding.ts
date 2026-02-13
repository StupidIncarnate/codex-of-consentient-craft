/**
 * PURPOSE: React hook that fetches and manages the list of projects with loading, error, and refresh support
 *
 * USAGE:
 * const {projects, loading, error, refresh} = useProjectsBinding();
 * // Returns {projects: ProjectListItem[], loading: boolean, error: Error | null, refresh: () => Promise<void>}
 */
import { useCallback, useEffect, useState } from 'react';

import type { ProjectListItem } from '@dungeonmaster/shared/contracts';

import { projectListBroker } from '../../brokers/project/list/project-list-broker';

export const useProjectsBinding = (): {
  projects: ProjectListItem[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} => {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await projectListBroker();
      setProjects(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects().catch(() => undefined);
  }, [fetchProjects]);

  return { projects, loading, error, refresh: fetchProjects };
};
