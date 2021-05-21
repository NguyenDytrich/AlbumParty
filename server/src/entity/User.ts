import { Column, Entity, PrimaryColumn, OneToMany } from 'typeorm';
import { Party } from './Party';

@Entity()
export class User {
  @PrimaryColumn('int')
  public id!: number;

  @Column('varchar', { unique: true })
  public username!: string;

  @Column('varchar', { unique: true })
  public authToken!: string;

  @Column('varchar', { unique: true })
  public refreshToken!: string;

  @OneToMany(() => Party, (party) => party.owner)
  public parties!: Party[];
}
