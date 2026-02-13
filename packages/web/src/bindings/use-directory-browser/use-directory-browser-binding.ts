/**
 * PURPOSE: React hook that manages directory browsing state with navigation support
 *
 * USAGE:
 * const {currentPath, entries, loading, navigateTo, goUp} = useDirectoryBrowserBinding();
 * // Returns {currentPath: ProjectPath | null, entries: DirectoryEntry[], loading: boolean, navigateTo, goUp}
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { DirectoryEntry, ProjectPath } from '@dungeonmaster/shared/contracts';

import { directoryBrowseBroker } from '../../brokers/directory/browse/directory-browse-broker';
import { parentPathTransformer } from '../../transformers/parent-path/parent-path-transformer';

export const useDirectoryBrowserBinding = (): {
  currentPath: ProjectPath | null;
  entries: DirectoryEntry[];
  loading: boolean;
  navigateTo: (params: { path: ProjectPath }) => void;
  goUp: () => void;
} => {
  const [currentPath, setCurrentPath] = useState<ProjectPath | null>(null);
  const [displayPath, setDisplayPath] = useState<ProjectPath | null>(null);
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const initialResolved = useRef(false);

  const browse = useCallback(async ({ path }: { path: ProjectPath | null }): Promise<void> => {
    setLoading(true);

    try {
      const result = await directoryBrowseBroker(path === null ? {} : { path });
      setEntries(result);

      const [firstEntry] = result;

      if (!initialResolved.current && path === null && firstEntry) {
        initialResolved.current = true;
        setDisplayPath(parentPathTransformer({ path: firstEntry.path }));
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    browse({ path: currentPath }).catch(() => undefined);
  }, [browse, currentPath]);

  const navigateTo = useCallback(({ path }: { path: ProjectPath }): void => {
    setCurrentPath(path);
    setDisplayPath(path);
  }, []);

  const goUp = useCallback((): void => {
    if (currentPath === null) {
      return;
    }

    const parentPath = parentPathTransformer({ path: currentPath });
    setCurrentPath(parentPath);
    setDisplayPath(parentPath);
  }, [currentPath]);

  return { currentPath: displayPath ?? currentPath, entries, loading, navigateTo, goUp };
};
