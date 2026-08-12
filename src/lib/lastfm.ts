export interface LastFmImage {
  "#text": string;
  size: string;
}

export interface LastFmTrack {
  artist: { "#text": string };
  name: string;
  album: { "#text": string };
  url: string;
  "@attr"?: { nowplaying: string };
  image: LastFmImage[];
}

export interface LastFmResponse {
  recenttracks?: {
    track: LastFmTrack[];
  };
}

export interface NowPlayingData {
  isPlaying: boolean;
  trackName: string;
  artistName: string;
  text: string;
}

export async function getNowPlaying(
  username: string,
  apiKey: string,
): Promise<NowPlayingData | null> {
  if (!username || !apiKey) return null;

  const endpoint = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) return null;

    const data: LastFmResponse = await response.json();
    const tracks = data.recenttracks?.track;

    if (!tracks || tracks.length === 0) return null;

    const currentTrack = tracks[0];
    const isPlaying = currentTrack["@attr"]?.nowplaying === "true";
    const artistName = currentTrack.artist["#text"];
    const trackName = currentTrack.name;
    const text = `${trackName} - ${artistName}`;

    return {
      isPlaying,
      trackName,
      artistName,
      text,
    };
  } catch (err) {
    return null;
  }
}
