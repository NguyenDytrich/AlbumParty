import { DataTypes, Model } from 'sequelize';
import { HasManyGetAssociationsMixin, HasManyCreateAssociationMixin } from 'sequelize';
import { Party } from './Party';

export class User extends Model {
  public username!: string;
  public displayName!: string;
  public authToken!: string;
  public refreshToken!: string;

  public getParties!: HasManyGetAssociationsMixin<Party>;
  public createParty!: HasManyCreateAssociationMixin<Party>;
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
