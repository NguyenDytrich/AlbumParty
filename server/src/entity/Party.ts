import { Column, Entity, PrimaryColumn, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity()
export class Party {
  @PrimaryColumn('int')
  public id!: number;

  @Column('varchar', { unique: true })
  public uri!: string;

  @ManyToOne(() => User, (user: User) => user.parties)
  public owner!: User;
}
