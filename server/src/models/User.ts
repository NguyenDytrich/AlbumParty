import { DataTypes, Model } from 'sequelize';
import { Party, PartyAttributes } from './Party';

export class User extends Model {
  public username!: string;
  public displayName!: string;
  public authToken!: string;
  public refreshToken!: string;

  public getParty!: () => Promise<Party>;
  public setParty!: (args: Party | null) => Promise<void>;
  public createParty!: (args: PartyAttributes) => Promise<Party>;
}

export const UserArgs = {
  username: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  displayName: DataTypes.STRING,
  authToken: DataTypes.STRING,
  refreshToken: DataTypes.STRING,
};
