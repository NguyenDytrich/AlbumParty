import { DataTypes, Model } from 'sequelize';
import { User } from './User';

export class Party extends Model {
  public owner!: User;
  public uuid!: string;
}

export const PartyArgs = {
  uuid: {
    type: DataTypes.UUID,
    unique: true,
  },
};
