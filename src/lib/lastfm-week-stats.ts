export interface ItemStat {
  name: string;
  subtext: string;
  playcount: string;
  url: string;
}

export interface WeeklyStats {
  albums: ItemStat[];
  artists: ItemStat[];
  tracks: ItemStat[];
}

export async function getWeeklyStats(
  username: string,
  apiKey: string,
): Promise<WeeklyStats | null> {
  if (!username || !apiKey) return null;

  const baseUrl = "https://ws.audioscrobbler.com/2.0/";
  const period = "7day";
  const limit = "3";

  try {
    const [albumsRes, artistsRes, tracksRes] = await Promise.all([
      fetch(
        `${baseUrl}?method=user.gettopalbums&user=${username}&api_key=${apiKey}&period=${period}&limit=${limit}&format=json`,
      ),
      fetch(
        `${baseUrl}?method=user.gettopartists&user=${username}&api_key=${apiKey}&period=${period}&limit=${limit}&format=json`,
      ),
      fetch(
        `${baseUrl}?method=user.gettoptracks&user=${username}&api_key=${apiKey}&period=${period}&limit=${limit}&format=json`,
      ),
    ]);

    if (!albumsRes.ok || !artistsRes.ok || !tracksRes.ok) return null;

    const [albumsData, artistsData, tracksData] = await Promise.all([
      albumsRes.json(),
      artistsRes.json(),
      tracksRes.json(),
    ]);

    const albums: ItemStat[] = (albumsData.topalbums?.album || []).map(
      (a: any) => ({
        name: a.name,
        subtext: a.artist.name,
        playcount: a.playcount,
        url: a.url,
      }),
    );

    const artists: ItemStat[] = (artistsData.topartists?.artist || []).map(
      (a: any) => ({
        name: a.name,
        subtext: `${a.playcount} scrobbles`,
        playcount: a.playcount,
        url: a.url,
      }),
    );

    const tracks: ItemStat[] = (tracksData.toptracks?.track || []).map(
      (t: any) => ({
        name: t.name,
        subtext: t.artist.name,
        playcount: t.playcount,
        url: t.url,
      }),
    );

    return { albums, artists, tracks };
  } catch (err) {
    return null;
  }
}
