import http from 'http';
import { Server, Socket } from 'socket.io';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import SequelizeStore from 'connect-session-sequelize';
import Redis from 'ioredis';

import { init, User, Party } from './models';
import PartyRoutes from './routes/Parties';
import PlayerRoutes from './routes/Player';

import SpotifyWebApi from 'spotify-web-api-node';
import { SpotifyClients as Clients, SpotifyApiHelper as Helper } from './lib';

import qs from 'querystring';
import crypto from 'crypto';

dotenv.config();

let io: Server;
const redis = new Redis();
const baseUrl = `https://${process.env.HOST_NAME}`;

(async () => {
  const app = express();
  const sequelize = await init();
  const SessionStore = SequelizeStore(session.Store);
  const store = new SessionStore({ db: sequelize });
  await store.sync({ force: true });

  app.use(
    session({
      resave: false,
      saveUninitialized: false,
      store,
      secret: process.env.SESSION_SECRET ?? '',
    }),
  );

  app.use(bodyParser.json());

  app.use(
    cors({
      origin: process.env.CORS_ORIGINS?.split(' '),
      credentials: true,
    }),
  );

  // Express routes
  app.get('/ping', (req, res) => {
    return res.send('pong');
  });

  app.get('/login', (req, res) => {
    const csrf = crypto.randomBytes(64).toString('hex');
    req.session.state = csrf;

    const scopes = [
      'user-library-read',
      'user-library-modify',
      'user-read-currently-playing',
      'user-modify-playback-state',
      'user-read-playback-state',
      'user-read-recently-played',
    ];

    const args = {
      client_id: process.env.SPOTIFY_CLIENT_ID,
      redirect_uri: `${baseUrl}/login/callback`,
      response_type: 'code',
      scope: scopes.join(' '),
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
      return res.sendStatus(500);
    }

    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: `${baseUrl}/login/callback`,
    });

    const { body: tokens } = await spotifyApi.authorizationCodeGrant(code as string);
    spotifyApi.setAccessToken(tokens.access_token);
    spotifyApi.setRefreshToken(tokens.refresh_token);

    const { body: apiUser } = await spotifyApi.getMe();

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

    Clients.set(apiUser.id, spotifyApi);

    return res.redirect(process.env.APP_URL ?? '/');
  });

  app.get('/auth', async (req, res) => {
    if (!req.session.isAuth) {
      return res.sendStatus(404);
    }
    return res.json({
      isAuth: req.session.isAuth,
      user: req.session.user,
    });
  });

  app.use('/parties', PartyRoutes);
  app.use('/player', PlayerRoutes);

  // Socket.io initialization
  // TODO remove from redis when a user leaves
  const server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(' '),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Put this here so io is defined in its scope
  // TODO destroy spotify api client as well
  app.post('/logout', async (req, res) => {
    const username = req.session.user ?? '';
    const party = await Party.findOne({ where: { owner: username } });
    if (party) await party.destroy();

    const room = await redis.get(`${username}:room`);

    // remove this key is not dependent on whether or not
    // a room exists
    await redis.del(`${username}:socket`);

    const socketId = await redis.get(`${username}:socket`);
    if (socketId && room) {
      // Remove user from room
      await redis.srem(room, username);
      await redis.del(`${username}:room`);

      const sockets = await io.in(socketId).fetchSockets();
      for (const s of sockets) {
        s.leave(room);
      }
    }

    req.session.destroy(async (err) => {
      if (!err) {
        return res.sendStatus(200);
      } else {
        return res.sendStatus(500);
      }
    });
  });

  // Basic auth middleware
  io.use(async (socket, next) => {
    const username = socket.handshake.auth.user;
    const user = await User.findByPk(username);
    if (!user) {
      next(new Error('Unauthorized'));
    } else {
      await redis.set(`${username}:socket`, socket.id);
      next();
    }
  });

  // TODO srem user from rooms, flush usr key on disconnect
  io.on('connection', (socket: Socket) => {
    socket.on('join-party', async (args) => {
      const party = await Party.findByPk(args.uuid);
      const host = Clients.get(party?.owner ?? '');
      const user = Clients.get(args.user);

      if (!party || !host || !user) throw new Error('Socket.io attempted to join non-existant party');

      // Join the party room
      socket.join(args.uuid);

      // add user to set in redis
      await redis.sadd(args.uuid, args.user);
      await redis.set(`${args.user}:room`, args.uuid);

      // Sync unless host
      if (args.user !== party.owner) {
        // Greet
        io.to(args.uuid).emit('message', {
          id: 0,
          author: args.user,
          message: 'has joined the party!',
          meta: { server: true },
        });

        // Play track at playhead
        const progress = await Helper.getTrackProgress(host);
        if (progress >= 0) {
          // Call client.start
          await user.play({
            context_uri: party.currentlyPlaying.contextUri,
            offset: { uri: `spotify:track:${party.currentlyPlaying.trackId}` },
            position_ms: progress,
          });
        }
      }
    });
    socket.on('new-message', (args) => {
      io.to(args.room).emit('message', { id: 0, author: args.author, message: args.message, meta: {} });
    });
    socket.on('leave-party', async (args) => {
      const username = socket.handshake.auth.user;
      await socket.leave(args.uuid);
      console.log(await redis.srem(args.uuid, username));
      await redis.del(`${username}:room`);

      io.to(args.uuid).emit('message', {
        id: 0,
        author: args.author,
        message: 'has left the party',
        meta: { server: true },
      });
    });
  });

  server.listen(3000, () => {
    console.log('Listening on 3000');
  });
})();

export { io, redis };
