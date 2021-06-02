import { Router } from 'express';

import { User, Party } from '../models';
import { SpotifyClients as Clients, SpotifyApiHelper as Helper } from '../lib';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// api/parties

/**
 * Create a Party
 */
router.post('/', async (req, res) => {
  if (!req.session.isAuth) return res.status(401);
  const user = await User.findByPk(req.session.user);
  if (!user) return res.sendStatus(401);
  await Party.destroy({
    where: {
      owner: req.session.user,
    },
  });

  const wrapper = Clients.get(user.username);
  if (!wrapper) throw new Error('No wrapper found for user.');

  const playing = await Helper.getTrackInfo(wrapper);

  const party = await user.createParty({
    uuid: uuidv4(),
    currentlyPlaying: playing,
  });
  return res.send(party.uuid);
});

router.get('/:partyId', async (req, res) => {
  try {
    const party = await Party.findOne({ where: { uuid: req.params.partyId } });
    if (!party) return res.sendStatus(404);
    res.status(200);
    return res.json(party);
  } catch (err) {
    return res.sendStatus(500);
  }
});

router.get('/:partyId/host', async (req, res) => {
  const party = await Party.findOne({ where: { uuid: req.params.partyId } });
  if (!party) return res.sendStatus(404);
  const amiHost = req.session.user === party.owner;
  res.status(200);
  return res.json({ host: party.owner, isMe: amiHost });
});

router.get('/', async (req, res) => {
  const parties = await Party.findAll();
  return res.json(parties);
});

export default router;
