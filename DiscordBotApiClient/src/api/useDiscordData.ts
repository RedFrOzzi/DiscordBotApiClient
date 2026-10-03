import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  discordApi,
  type DiscordGuild,
  type DiscordUser,
  type DiscordChannel,
} from "../api/discordApi";
import { useAuth } from "../auth/useAuth";

export function useDiscordData() {
  const { isAuthenticated } = useAuth();

  const guildsQuery = useQuery({
    queryKey: ["discord", "guilds"],
    queryFn: discordApi.getGuilds,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 60 * 1000, //2h
  });

  // Fetch users/channels only after guilds have arrived.
  const usersQuery = useQuery({
    queryKey: ["discord", "users"],
    queryFn: discordApi.getUsers,
    enabled: isAuthenticated && guildsQuery.isSuccess,
    staleTime: 2 * 60 * 60 * 1000, //2h
  });

  const channelsQuery = useQuery({
    queryKey: ["discord", "channels"],
    queryFn: discordApi.getChannels,
    enabled: isAuthenticated && guildsQuery.isSuccess,
    staleTime: 2 * 60 * 60 * 1000, //2h
  });

  const isLoading =
    guildsQuery.isLoading || usersQuery.isLoading || channelsQuery.isLoading;
  const isError =
    guildsQuery.isError || usersQuery.isError || channelsQuery.isError;

  //Lookup maps
  const lookups = useMemo(() => {
    const guilds = guildsQuery.data ?? [];
    const users = usersQuery.data ?? [];
    const channels = channelsQuery.data ?? [];

    const guildById = new Map<string, DiscordGuild>();
    const userById = new Map<string, DiscordUser>();
    const channelById = new Map<string, DiscordChannel>();
    const usersByGuild = new Map<string, DiscordUser[]>();
    const channelsByGuild = new Map<string, DiscordChannel[]>();

    for (const g of guilds) if (g.id) guildById.set(g.id, g);

    for (const u of users) {
      userById.set(u.id, u);
      for (const gid of u.guildIds ?? []) {
        const arr = usersByGuild.get(gid) ?? [];
        arr.push(u);
        usersByGuild.set(gid, arr);
      }
    }

    for (const c of channels) {
      channelById.set(c.id, c);
      if (c.guildId) {
        const arr = channelsByGuild.get(c.guildId) ?? [];
        arr.push(c);
        channelsByGuild.set(c.guildId, arr);
      }
    }

    return {
      guilds,
      users,
      channels,
      guildById,
      userById,
      channelById,
      usersByGuild,
      channelsByGuild,
    };
  }, [guildsQuery.data, usersQuery.data, channelsQuery.data]);

  return {
    ...lookups,
    isLoading,
    isError,
    refetchAll: () => {
      guildsQuery.refetch();
      usersQuery.refetch();
      channelsQuery.refetch();
    },
    refetchGuilds: guildsQuery.refetch,
    refetchUsers: usersQuery.refetch,
    refetchChannels: channelsQuery.refetch,
  };
}
