import { SpotifyClients, SpotifyApiHelper as Helper, Synchronizer } from '../lib';
import { io, redis } from '../index';

import { User, Party } from '../models';

import { Router } from 'express';

const router = Router();

// Validate session is authenticated
const isAuth = (req: any, res: any, next: any) => {
  if (!req.session.isAuth) res.sendStatus(401);
  next();
};

// api/player

router.post('/pause', isAuth, async (req, res) => {
  const room = req.body.room;
  if (room) {
    io.to(room).emit('message', {
      id: 0,
      author: req.session.user,
      message: 'paused playback',
      meta: { server: true },
    });
  }

  const members = await redis.smembers(room);
  const clients = SpotifyClients.getAll(members);

  try {
    const dispatched = clients.map((c) => c.pause());
    await Promise.allSettled(dispatched);
    Synchronizer.cancel(room);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

router.post('/play', isAuth, async (req, res) => {
  const room = req.body.room;
  if (room) {
    io.to(room).emit('message', {
      id: 0,
      author: req.session.user,
      message: 'resumed playback',
      meta: { server: true },
    });
  }

  const members = await redis.smembers(room);
  const party = await Party.findByPk(room);
  const statusMap = new Map<string, string>();

  if (!party) return res.sendStatus(500);

  // TODO
  // move to utility function, then batch await all these
  for (const m of members) {
    const client = SpotifyClients.get(m);
    if (!client) {
      statusMap.set(m, 'ERROR');
      break;
    }

    try {
      await client.play();
      statusMap.set(m, 'OK');
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
          try {
            await client.play({ device_id: device.id ?? undefined });
            statusMap.set(m, 'OK');
          } catch {
            statusMap.set(m, 'ERROR');
          }
        }

        // TODO
        // Otherwise return an external link
      } else if (err.statusCode === 401) {
        // Retry once after refreshing access token
        client.refreshAccessToken();
        try {
          await client.play();
          statusMap.set(m, 'OK');
        } catch (err) {
          statusMap.set(m, 'ERROR');
        }
      }
    }
  }

  // Slight delay before sending the update signal
  const host = await SpotifyClients.get(party.owner);
  let ttu = 1000; // Arbitrary 1s time to update if host client doesn't exist
  if (host) {
    ttu = (await Helper.getTimeToUpdate(host)) ?? ttu;
  }
  const timer = await Synchronizer.schedule(room, ttu - 100); // Arbitrary delay
  await timer;

  return res.json(JSON.stringify(statusMap));
});

router.post('/save', isAuth, async (req, res) => {
  const client = SpotifyClients.get(req.session.user ?? '');
  if (!client) {
    // TODO try and set up a client if none exists
    return res.sendStatus(500);
  }

  const playing = await client.getMyCurrentPlayingTrack();
  const id = playing.body?.item?.id;
  if(!id) return res.sendStatus(500);

  try {
    await client.addToMySavedTracks([id]);
    return res.sendStatus(204);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

router.post('/skip', isAuth, async (req, res) => {
  const back = req.query.back ?? false;
  const room = req.body.room;
  if (room) {
    io.to(room).emit('message', {
      id: 0,
      author: req.session.user,
      message: `skipped to ${back ? 'previous' : 'next'} track`,
      meta: { server: true },
    });
  }

  const members = await redis.smembers(room);
  const clients = SpotifyClients.getAll(members);
  const party = await Party.findByPk(room);

  if (!party) return res.sendStatus(500);

  try {
    let dispatched;
    if (back) {
      dispatched = clients.map((c) => c.skipToPrevious());
    } else {
      dispatched = clients.map((c) => c.skipToNext());
    }
    const status = await Promise.allSettled(dispatched);
    res.status(200).json(status);
  } catch (err) {
    console.error(err);
    res.status(500);
  }

  // Slight delay before sending the update signal
  const timer = await Synchronizer.schedule(room, 10);
  await timer;

  return res.end();
});

export default router;
