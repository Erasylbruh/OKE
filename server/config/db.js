import mysql from 'mysql2/promise';
import { config } from './env.js';

const pool = mysql.createPool(config.db);

console.log('Database pool created with config:', {
    ...config.db,
    password: config.db.password ? '******' : 'undefined'
});

export default pool;
