import { Sequelize } from 'sequelize';
import { Party, PartyArgs } from './Party';
import { User, UserArgs } from './User';

export async function init(): Promise<Sequelize> {
  const sequelize = new Sequelize(process.env.DB_CONNECTION_URL ?? '');
  const args = { underscored: true };

  await Party.init(PartyArgs, { sequelize, ...args });
  await User.init(UserArgs, { sequelize, ...args });
  await sequelize.sync();

  // Associations
  User.hasOne(Party, { foreignKey: 'owner', sourceKey: 'username' });
  Party.belongsTo(User, { foreignKey: 'owner', targetKey: 'username' });

  await sequelize.sync({ force: true });

  return sequelize;
}

export { User, Party };
