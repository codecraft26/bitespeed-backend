// src/data-source.ts
import { DataSource } from 'typeorm';
import { Contact } from './entity/Contact';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'mypassword',
  database: 'postgres',
  synchronize: true,
  logging: false,
  entities: [Contact],
  migrations: [],
  subscribers: [],
});
