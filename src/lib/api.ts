import { getAccessToken } from "./auth";
import { supabase } from "./supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
// Note: API_BASE_URL not required at build time

type ApiFetchOptions = RequestInit & {
  timeoutMs?: number;
  retry?: number;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    timeoutMs = 15_000,
    retry = 0,
    headers,
    body,
    ...rest
  } = options;

  const token = await getAccessToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isFormData = body instanceof FormData;

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      body,
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    // 401 → força logout
    if (res.status === 401) {
      await supabase.auth.signOut();
      window.location.href = "/login";
      throw new Error("Sessão expirada");
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new Error(data?.error || `Erro HTTP ${res.status}`);
    }

    return data as T;
  } catch (err) {
    // Retry simples
    if (retry > 0) {
      return apiFetch<T>(path, { ...options, retry: retry - 1 });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}