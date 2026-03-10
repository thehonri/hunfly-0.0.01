import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface Workspace {
  tenantId: string;
  tenantName: string | null;
  role: string;
  accountId: string | null;
  accountStatus: string | null;
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Workspace>('/api/workspace')
      .then(setWorkspace)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { workspace, loading, error };
}
