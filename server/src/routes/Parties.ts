import { Router } from 'express';

import { User, Party } from '../models';
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
  const party = await user.createParty({ uuid: uuidv4() });
  return res.send(party.uuid);
});

router.get('/:partyId', async (req, res) => {
  const party = await Party.findOne({ where: { uuid: req.params.partyId } });
  console.log(party);
  if (!party) return res.sendStatus(404);
  return res.sendStatus(200);
});

router.get('/', async (req, res) => {
  const parties = await Party.findAll();
  return res.json(parties);
});

export default router;
