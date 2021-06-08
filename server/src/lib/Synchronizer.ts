import { SpotifyClients as Clients, SpotifyApiHelper as Helper } from './index';
import { Party } from '../models';
import { io } from '../index';

/**
 * Synchronizes the room information to the Host's Spotify client
 */
class Synchronizer {
  // Timeout functions mapped to Room UUIDs
  readonly timers: Map<string, NodeJS.Timeout>;

  constructor() {
    this.timers = new Map<string, NodeJS.Timeout>();
  }

  // TODO there's gotta be a way to do this without returning a promise from
  // a promise?
  public async schedule(room: string, timeInMs: number, retry = 0): Promise<NodeJS.Timeout> {
    console.log('Scheduleding next timeout for ' + timeInMs + 'ms');
    const party = await Party.findByPk(room);

    // TODO instead of throwing an error, just remove the key from UUIDs,
    // delete the room from redis if it exists
    if (!party) throw new Error(`No party found for uuid "${room}"`);

    const hostClient = Clients.get(party.owner);
    if (!hostClient) throw new Error(`Host client not found for party ${room}`);

    const update = async () => {
      console.log('Waiting for track info');
      const playing = await Helper.getTrackInfo(hostClient);
      if (party.currentlyPlaying?.trackId == playing.trackId) {
        console.log(`Track not updated. Retrying ${retry}s.`);
        await this.schedule(room, retry * 1000, retry + 1);
      } else {
        party.currentlyPlaying = playing;
        console.log('Waiting for save');
        await party.save();
        io.to(room).emit('update-player');

        // Recursively schedule
        const ttu = await Helper.getTimeToUpdate(hostClient);
        console.log(`ttu: ${ttu / 1000}s`);
        if (ttu >= 0) {
          console.log('calling next schedule....');
          await this.schedule(room, ttu);
        }
      }
    };

    let timer;
    if (!party.currentlyPlaying) {
      timer = setTimeout(update, 0);
    } else {
      timer = setTimeout(update, timeInMs + 1000);
    }

    // Cancel the timeout if there was one.
    const _old = this.timers.get(room);
    this.timers.set(room, timer);

    if (_old) clearTimeout(_old);
    return timer;
  }

  public cancel(room: string): void {
    const timer = this.timers.get(room);
    if (timer) {
      clearTimeout(timer);
    }
  }
}

const synchronizer = new Synchronizer();
Object.freeze(synchronizer);

export default synchronizer;
