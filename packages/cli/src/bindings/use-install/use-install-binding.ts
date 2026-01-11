/**
 * PURPOSE: React hook that runs install orchestration and manages loading/error states
 *
 * USAGE:
 * const {data, loading, error} = useInstallBinding({context});
 * // Returns {data: InstallResult[], loading: boolean, error: Error | null}
 */
import React from 'react';

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';

import { installRunBroker } from '../../brokers/install/run/install-run-broker';

export const useInstallBinding = ({
  context,
}: {
  context: InstallContext;
}): {
  data: InstallResult[];
  loading: boolean;
  error: Error | null;
} => {
  const [data, setData] = React.useState<InstallResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    installRunBroker({ context })
      .then((result) => {
        if (isMounted) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [context]);

  return { data, loading, error };
};
