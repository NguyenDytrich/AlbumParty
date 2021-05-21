import { SessionEntity } from 'typeorm-store';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Session implements SessionEntity {
  @PrimaryColumn('varchar', { length: 255 })
  public id!: string;

  @Column('bigint')
  public expiresAt!: number;

  @Column('text')
  public data!: string;
}
