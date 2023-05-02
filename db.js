// 导入 'pg' 库
const { Pool } = require('pg');

// 创建一个连接池
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: {
    //   rejectUnauthorized: false,
    // },
  });

// 导出连接池，以便在其他文件中使用
module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback);
  },
};

const createEnvelopesTable = async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS envelopes (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          budget NUMERIC(10, 2) NOT NULL
        )
      `);
      console.log("Envelopes table created successfully.");
    } catch (error) {
      console.error("Error creating envelopes table:", error);
    }
  };

  createEnvelopesTable();