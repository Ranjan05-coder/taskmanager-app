const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS project_members (
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (project_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(300) NOT NULL,
        description TEXT,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID NOT NULL REFERENCES users(id),
        status VARCHAR(30) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
        priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
        due_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_pm_user ON project_members(user_id);
    `);
    console.log('✅ Database initialized');
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
