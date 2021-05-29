import { Router } from 'express';

import { User, Party } from '../models';
import { ImageInfo } from '../models/Party';
import Clients from '../lib';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// api/parties

/**
 * Create a Party
 */
router.post('/', async (req, res) => {
  if (!req.session.isAuth) return res.status(401);
  const user = await User.findByPk(req.session.user);
  if (!user) return res.status(401);
  await Party.destroy({
    where: {
      owner: req.session.user,
    },
  });

  const wrapper = Clients.get(user.username);
  if (!wrapper) throw new Error('No wrapper found for user.');

  let data;
  let item;
  let playing;

  data = await wrapper.getMyCurrentPlaybackState();
  if (data.body && data.body.is_playing) {
    console.log('TODO user is playing a track');
  } else if (data.statusCode == 204) {
    // Get the most recently played track and use that as our "currently playing"
    // This won't return any album art or album information, so need to query the
    // API twice here
    data = await wrapper.getMyRecentlyPlayedTracks({ limit: 1 });

    item = data.body.items[0];

    if (!item) throw new Error('No recently played tracks?');

    const contextUri = item.context.uri;
    const contextUrl = item.context.external_urls.spotify;
    const trackId = item.track.id;
    const trackName = item.track.name;

    const _artists = item.track.artists;
    const artists = _artists.map(({ name }) => name);

    data = await wrapper.getTrack(trackId ?? '');
    const images = data.body.album.images as ImageInfo[];
    const albumName = data.body.album.name;

    playing = { trackId, trackName, artists, contextUri, contextUrl, images, albumName };
  }

  const party = await user.createParty({
    uuid: uuidv4(),
    currentlyPlaying: playing,
  });
  return res.send(party.uuid);
});

router.get('/:partyId', async (req, res) => {
  const party = await Party.findOne({ where: { uuid: req.params.partyId } });
  if (!party) return res.sendStatus(404);
  res.status(200);
  return res.json(party);
});

router.get('/', async (req, res) => {
  const parties = await Party.findAll();
  return res.json(parties);
});

export default router;
