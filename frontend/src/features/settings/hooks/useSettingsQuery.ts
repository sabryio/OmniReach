import { useQuery } from "@tanstack/react-query";
import { SettingsQueryKeys } from "../api/queryKeys";
import { getSettings } from "../api/settings.api";
import { type AppSettings } from "../schemas/settings.schema";

const DEFAULT_SETTINGS: AppSettings = {
  schedulerStartHour: 9,
  schedulerEndHour: 21,
  schedulerStrictTimeWindow: true,
  wabridgeBaseUrl: "http://localhost:7171",
  wabridgeTimeoutMs: 5000,
};

export function useSettingsQuery() {
  const query = useQuery({
    queryKey: SettingsQueryKeys.config(),
    queryFn: getSettings,
  });
  return {
    settings: query.data ?? DEFAULT_SETTINGS,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
