import { DataTypes, Model } from 'sequelize';
import { User } from './User';

export interface ImageInfo {
  height: number;
  width: number;
  url: string;
}

export interface CurrentlyPlaying {
  contextUri?: string;
  contextUrl?: string;
  images?: ImageInfo[];
  albumName?: string;
  artists?: string[];
  trackName?: string;
  trackId?: string;
}

export interface PartyAttributes {
  uuid: string;
  currentlyPlaying?: CurrentlyPlaying;
}

export class Party extends Model {
  public owner!: string;
  public uuid!: string;
  public currentlyPlaying!: CurrentlyPlaying;
  public isPlaying!: boolean;
}

export const PartyArgs = {
  uuid: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  currentlyPlaying: {
    type: DataTypes.JSON,
  },
  isPlaying: {
    type: DataTypes.Boolean,
  },
};
