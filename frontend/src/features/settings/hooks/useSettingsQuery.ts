import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/rpc";
import type { AppSettings } from "@/rpc/bindings";

const DEFAULT_SETTINGS: AppSettings = {
  scheduler_start_hour: 9,
  scheduler_end_hour: 21,
  scheduler_strict_time_window: true,
  wabridge_base_url: "http://localhost:7171",
  wabridge_timeout_ms: 5000,
};

export function useSettingsQuery() {
  const query = useQuery(orpc.settings.load.queryOptions());
  return {
    settings: query.data ?? DEFAULT_SETTINGS,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
