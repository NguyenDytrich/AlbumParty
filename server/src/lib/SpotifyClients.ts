import SpotifyWebApi from 'spotify-web-api-node';

class SpotifyClients {
  readonly clients: Map<string, SpotifyWebApi>;
  /** For when need to create a wrapper?
   * private _clientId: string;
   * private _clientSecret: string;
   * private _redirectUri: string;
   */

  constructor() {
    this.clients = new Map<string, SpotifyWebApi>();

    // this._clientId = args.clientId;
    // this._clientSecret = args.clientSecret;
    // this._redirectUri = args.redirectUri;
  }

  public get(user: string): SpotifyWebApi | undefined {
    return this.clients.get(user);
  }

  public destroy(user: string): void {
    this.clients.delete(user);
  }

  public set(user: string, wrapper: SpotifyWebApi) {
    this.clients.set(user, wrapper);
  }
}

const wrapper = new SpotifyClients();
Object.freeze(wrapper);

export default wrapper;
