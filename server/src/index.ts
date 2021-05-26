import http from 'http';
import { Server, Socket } from 'socket.io';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import SequelizeStore from 'connect-session-sequelize';

import { init, User } from './models';
import PartyRoutes from './routes/Parties';

import SpotifyWebApi from 'spotify-web-api-node';

import qs from 'querystring';
import crypto from 'crypto';

dotenv.config();

(async () => {
  const app = express();
  const SessionStore = SequelizeStore(session.Store);
  const sequelize = await init();
  const store = new SessionStore({ db: sequelize });

  app.use(
    session({
      resave: false,
      saveUninitialized: false,
      store,
      secret: 'superdupersecret',
    }),
  );

  app.use(
    cors({
      origin: process.env.CORS_ORIGINS?.split(' '),
      credentials: true,
    }),
  );

  await store.sync({ force: true });

  // Express routes
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

    req.session.save((err) => {
      if (err) console.error(err);
      return res.redirect(`https://accounts.spotify.com/authorize?${qs.stringify(args)}`);
    });
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

    const { body: apiUser } = await spotifyApi.getMe();
    console.log(apiUser);

    try {
      const [user, created] = await User.findOrCreate({ where: { username: apiUser.id } });
      if (created) {
        user.displayName = apiUser.display_name ?? apiUser.id;
      }
      user.authToken = tokens.access_token;
      user.refreshToken = tokens.refresh_token;
      await user.save();

      req.session.isAuth = true;
      req.session.user = apiUser.id;
    } catch (e) {
      throw e;
    }

    return res.redirect(process.env.APP_URL ?? '/');
  });

  app.get('/auth', async (req, res) => {
    console.log(req.session);
    if (!req.session.isAuth) {
      return res.sendStatus(404);
    }
    return res.json({
      isAuth: req.session.isAuth,
      user: req.session.user,
    });
  });

  app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (!err) {
        return res.status(200);
      } else {
        return res.status(500);
      }
    });
  });

  app.use('/parties', PartyRoutes);

  // Socket.io initialization

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(' '),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    socket.on('create-party', (...args) => {
      socket.join(args[0]);
    });
    socket.on('new-message', (args) => {
      io.to(args.room).emit('message', { id: 0, author: args.author, message: args.message });
    });
  });

  io.of('/').adapter.on('create-room', (room) => {
    console.log(`room ${room} was created`);
    console.log(io.of('/').adapter.rooms);
  });

  io.of('/').adapter.on('join-room', (room, id) => {
    console.log(`socket ${id} has joined ${room}`);
    console.log(io.of('/').adapter.rooms);
  });

  server.listen(3000);
})();
