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
  const party = await user.createParty({ uuid: uuidv4() });
  return res.send(party.uuid);
});

export default router;
