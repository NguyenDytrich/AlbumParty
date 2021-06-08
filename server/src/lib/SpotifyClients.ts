import SpotifyWebApi from 'spotify-web-api-node';

class SpotifyClients {
  readonly clients: Map<string, SpotifyWebApi>;
  private refreshTimers: Map<string, NodeJS.Timeout>;
  /** For when need to create a wrapper?
   * private _clientId: string;
   * private _clientSecret: string;
   * private _redirectUri: string;
   */

  constructor() {
    this.clients = new Map<string, SpotifyWebApi>();
    this.refreshTimers = new Map<string, NodeJS.Timeout>();

    // this._clientId = args.clientId;
    // this._clientSecret = args.clientSecret;
    // this._redirectUri = args.redirectUri;
  }

  public get(user: string): SpotifyWebApi | undefined {
    return this.clients.get(user);
  }

  public getAll(users: string[]): SpotifyWebApi[] {
    return users.map((u) => this.clients.get(u)).filter((x) => x !== undefined) as SpotifyWebApi[];
  }

  public destroy(user: string): void {
    this.clients.delete(user);
  }

  public set(user: string, wrapper: SpotifyWebApi, expInSec?: number) {
    this.clients.set(user, wrapper);
    if (expInSec) {
      const timer = setTimeout(async () => {
        this.refreshToken(user);
      }, expInSec * 1000);
      this.refreshTimers.set(user, timer);
    } else {
      this.refreshToken(user);
    }
  }

  private async refreshToken(user: string) {
    console.log('Refreshing token');
    const wrapper = this.get(user);
    if(!wrapper) throw new Error('No wrapper found during refresh');

    const data = await wrapper.refreshAccessToken();

    wrapper.setAccessToken(data.body['access_token']);
    if (data.body['refresh_token']) wrapper.setRefreshToken(data.body['refresh_token']);

    console.log('Scheduling next token refresh in ' + (data.body['expires_in'] - 60) + 's');

    const timer = setTimeout(async () => {
      await this.refreshToken(user);
    }, (data.body['expires_in'] - 60) * 1000);
    this.refreshTimers.set(user, timer);
  }
}

const wrapper = new SpotifyClients();
Object.freeze(wrapper);

export default wrapper;
