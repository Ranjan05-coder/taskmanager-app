const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// Verify JWT and attach user to request
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, name }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Check if user is admin of the project (project_id in params or body)
const requireProjectAdmin = async (req, res, next) => {
  const projectId = req.params.projectId || req.body.project_id;
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    if (!rows.length || rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.projectRole = 'admin';
    next();
  } catch (err) {
    next(err);
  }
};

// Check if user is any member of the project
const requireProjectMember = async (req, res, next) => {
  const projectId = req.params.projectId || req.body.project_id;
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    if (!rows.length) {
      return res.status(403).json({ error: 'Not a project member' });
    }
    req.projectRole = rows[0].role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireProjectAdmin, requireProjectMember };
