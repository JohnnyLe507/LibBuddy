import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'libbuddy',
  password: '10242002',
  port: 5432,
});

export default pool;
