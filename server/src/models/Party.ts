import { DataTypes, Model, Optional } from 'sequelize';
import { User } from './User';

export interface PartyAttributes {
  uuid: string;
}

export class Party extends Model {
  public owner!: User;
  public uuid!: string;
}

export const PartyArgs = {
  uuid: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
};
