import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';

import { createConnection, getConnection, getRepository } from 'typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from 'typeorm-store';
import { TypeormStore } from 'typeorm-store';
import { Session } from './entity/Session';
import { User } from './entity/User';

import SpotifyWebApi from 'spotify-web-api-node';

import qs from 'querystring';
import crypto from 'crypto';

dotenv.config();

(async () => {
  const app = express();
  await createConnection();
  const sessionRepository = getRepository(Session) as unknown as Repository<SessionEntity>;

  app.use(
    session({
      resave: false,
      saveUninitialized: false,
      store: new TypeormStore({ repository: sessionRepository }),
      secret: 'superdupersecret',
    }),
  );

  app.get('/', (req, res) => {
    res.send('');
  });

  app.get('/ping', (req, res) => {
    return res.send('pong');
  });

  app.get('/login', (req, res) => {
    const csrf = crypto.randomBytes(64).toString('hex');
    req.session.state = csrf;

    const args = {
      client_id: process.env.SPOTIFY_CLIENT_ID,
      redirect_uri: 'http://localhost:3000/login/callback',
      response_type: 'code',
      state: csrf,
    };

    return res.redirect(`https://accounts.spotify.com/authorize?${qs.stringify(args)}`);
  });

  app.get('/login/callback', async (req, res) => {
    const { state, code } = req.query;
    if (state != req.session.state) {
      return res.status(500);
    }

    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: 'http://localhost:3000/login/callback',
    });

    const { body: tokens } = await spotifyApi.authorizationCodeGrant(code as string);
    spotifyApi.setAccessToken(tokens.access_token);
    spotifyApi.setRefreshToken(tokens.refresh_token);

    const { body: user } = await spotifyApi.getMe();

    const userRepository = getRepository(User);
    const existingRecord = await userRepository.findOne({ where: { username: user.display_name } });
    if (!existingRecord) {
      // Create a record if no user exists
      const _user = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            username: user.id,
            authToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
          },
        ])
        .returning('*')
        .execute();
      req.session.user = _user.generatedMaps[0].username;
    } else {
      // Just update the tokens in the database
      const _user = await getConnection()
        .createQueryBuilder()
        .update(User)
        .set({
          authToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        })
        .returning('*')
        .execute();
      req.session.user = _user.generatedMaps[0].username;
    }
    return res.redirect('/');
  });

  app.listen(process.env.PORT, () => {
    console.log('[INFO] listening on ' + process.env.PORT);
  });
})();
