import { useQuery } from "@tanstack/react-query";
import { audioTracksApi } from "./audioTracksApi";
import { useState } from "react";

export function useAudioTracks(guildId: string | null) {
  const [bust, setBust] = useState(0);

  const query = useQuery({
    queryKey: ["audio-tracks", guildId, bust],
    queryFn: () => audioTracksApi.getByGuild(guildId!, bust),
    enabled: !!guildId,
    staleTime: 60_000,
  });

  return { ...query, refetch: () => setBust(Date.now()) };
}
