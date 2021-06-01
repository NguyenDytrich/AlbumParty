import { SpotifyClients } from '../lib';
import { io } from '../index';

import { Router } from 'express';

const router = Router();

// Validate session is authenticated
const isAuth = (req: any, res: any, next: any) => {
  if (!req.session.isAuth) res.sendStatus(401);
  next();
};

// api/player

router.post('/pause', isAuth, async (req, res) => {
  const client = SpotifyClients.get(req.session.user ?? '');
  if (!client) {
    // TODO try and set up a client if none exists
    return res.sendStatus(500);
  }

  const room = req.body.room;
  if (room) {
    io.to(room).emit('message', {
      id: 0,
      author: req.session.user,
      message: 'paused playback',
      meta: { server: true },
    });
  }

  try {
    await client.pause();
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

router.post('/play', isAuth, async (req, res) => {
  const client = SpotifyClients.get(req.session.user ?? '');
  if (!client) {
    // TODO try and set up a client if none exists
    return res.sendStatus(500);
  }

  const room = req.body.room;
  if (room) {
    io.to(room).emit('message', {
      id: 0,
      author: req.session.user,
      message: 'resumed playback',
      meta: { server: true },
    });
  }

  // TODO just return 2xx if client is already playing

  try {
    await client.play();
    return res.sendStatus(200);
  } catch (err) {
    // No device found
    if (err.statusCode === 404) {
      // Check if there are any available devices
      const {
        body: { devices },
      } = await client.getMyDevices();

      // If there's a device, just play to the first
      // available one
      if (devices.length > 0) {
        const device = devices[0];
        await client.play({ device_id: device.id ?? undefined });
        return res.sendStatus(200);
      }

      // TODO
      // Otherwise return an external link
    } else if (err.statusCode === 401) {
      // Retry once after refreshing access token
      client.refreshAccessToken();
      try {
        await client.play();
        return res.sendStatus(200);
      } catch {
        return res.sendStatus(500);
      }
    }
    return res.sendStatus(500);
  }
});

router.post('/save', isAuth, async (req, res) => {
  const client = SpotifyClients.get(req.session.user ?? '');
  if (!client) {
    // TODO try and set up a client if none exists
    return res.sendStatus(500);
  }

  try {
    await client.addToMySavedTracks(req.body.ids);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

router.post('/skip', isAuth, async (req, res) => {
  const client = SpotifyClients.get(req.session.user ?? '');
  const back = req.query.back ?? false;
  if (!client) {
    return res.sendStatus(500);
  }

  const room = req.body.room;
  if (room) {
    io.to(room).emit('message', {
      id: 0,
      author: req.session.user,
      message: `skipped to ${back ? 'previous' : 'next'} track`,
      meta: { server: true },
    });
  }

  try {
    // Despite having a null check above,
    // TS still thinks client may be undefined
    if (back) {
      /* eslint-disable-next-line */
      await client!.skipToPrevious();
    } else {
      /* eslint-disable-next-line */
      await client!.skipToNext();
    }
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

export default router;
