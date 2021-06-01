import SpotifyWebApi from 'spotify-web-api-node';
import { ImageInfo, CurrentlyPlaying } from '../models/Party';

const SpotifyApiHelper = {
  getTrackInfo: async (client: SpotifyWebApi): Promise<CurrentlyPlaying> => {
    let data;
    let item;
    let playing;

    data = await client.getMyCurrentPlaybackState();
    if (data.body && data.statusCode == 200) {
      // Cast as any beacuse for some reason this is either an EpisodeObject or a TrackObject
      // and I honestly don't know how to cast it as a TrackObject??
      // Also TODO: how to implement this feature for Podcasts?
      const item = data.body.item as any;
      const { context } = data.body;
      const contextUri = context?.uri;
      const contextUrl = context?.external_urls.spotify;
      const trackId = item?.id;
      const trackName = item?.name;

      const _artists = item?.artists;
      const artists = _artists.map(({ name }: { name: string }) => name);
      const images = item?.album.images as ImageInfo[];
      const albumName = item?.album.name;

      playing = { trackId, trackName, artists, contextUri, contextUrl, images, albumName };
    } else if (data.statusCode == 204) {
      // Get the most recently played track and use that as our "currently playing"
      // This won't return any album art or album information, so need to query the
      // API twice here
      data = await client.getMyRecentlyPlayedTracks({ limit: 1 });

      item = data.body.items[0];

      if (!item) throw new Error('No recently played tracks?');

      const contextUri = item.context.uri;
      const contextUrl = item.context.external_urls.spotify;
      const trackId = item.track.id;
      const trackName = item.track.name;

      const _artists = item.track.artists;
      const artists = _artists.map(({ name }) => name);

      data = await client.getTrack(trackId ?? '');
      const images = data.body.album.images as ImageInfo[];
      const albumName = data.body.album.name;

      playing = { trackId, trackName, artists, contextUri, contextUrl, images, albumName };
    }

    return playing as CurrentlyPlaying;
  },
};

export default SpotifyApiHelper;
