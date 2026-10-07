import { useQuery } from "@tanstack/react-query";
import { discordApi, type VoiceStateDto } from "../api/discordApi";

const POLL_MS = 10_000;

export function useVoiceStates(guildId: string | null) {
  return useQuery<VoiceStateDto[]>({
    queryKey: ["voice-states", guildId],
    queryFn: async () => {
      if (!guildId) return [];
      try {
        return await discordApi.getVoiceStates(guildId);
      } catch {
        return [];
      }
    },
    enabled: !!guildId,
    refetchInterval: POLL_MS,
    staleTime: POLL_MS / 2,
    retry: false,
  });
}
