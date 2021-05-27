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

    let contextUri, contextUrl, trackId, images, albumName, trackName, artists;

    item = data.body.items[0];

    if (!item) throw new Error('No recently played tracks?');

    contextUri = item.context.uri;
    contextUrl = item.context.external_urls.spotify;
    trackId = item.track.id;
    trackName = item.track.name;

    const _artists = item.track.artists;
    artists = _artists.map(({ name }) => name);

    data = await wrapper.getTrack(trackId ?? '');
    images = data.body.album.images as ImageInfo[];
    albumName = data.body.album.name;

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
  return res.sendStatus(200);
});

router.get('/', async (req, res) => {
  const parties = await Party.findAll();
  return res.json(parties);
});

export default router;
