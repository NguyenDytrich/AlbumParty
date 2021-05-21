import { Router } from 'express';

import { getConnection, getRepository } from 'typeorm';
import { Party } from '../entity/Party';
import { User } from '../entity/User';

const router = Router();

// api/parties

/**
 * Create a Party
 */
router.post('/', async (req, res) => {
  if (!req.session.isAuth) return res.status(400);
  const userRepository = getRepository(User);
  const user = await userRepository.findOne({ where: { username: req.session.user } });

  const res = await getConnection()
    .createQueryBuilder()
    .insert()
    .into(Party)
    .values([{ uri: uuidv4() }])
    .execute();
});
