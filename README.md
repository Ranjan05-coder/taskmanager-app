<<<<<<< HEAD
# taskmanager-app
A simple task manager for teams. You can create projects, assign tasks, track progress, and manage team members.
=======
# TaskFlow

A simple task manager for teams. You can create projects, assign tasks, track progress, and manage team members.

## What's included

- User signup/login with JWT
- Create projects and invite members
- Add tasks with priority, status, due dates
- Kanban board for task management
- Admin/Member role-based access

## Tech used

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Deploy:** Railway

## Getting started

### Prerequisites
- Node.js 18+
- PostgreSQL running (or use Railway)

### Setup

```bash
# Clone repo
git clone <repo-url>
cd taskmanager

# Setup backend
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npm install
npm run dev

# In another terminal, setup frontend
cd frontend
cp .env.example .env
# Edit .env with VITE_API_URL=http://localhost:3001/api
npm install
npm run dev
```

Backend runs on `http://localhost:3001`
Frontend runs on `http://localhost:5173`

## Deploying to Railway

1. Push to GitHub
2. Create Railway project
3. Add PostgreSQL service
4. Deploy backend from `backend/` folder
   - Set `DATABASE_URL` from the postgres service
   - Set `JWT_SECRET` to something random
   - Set `FRONTEND_URL` to your frontend URL
5. Deploy frontend from `frontend/` folder
   - Set `VITE_API_URL` to your backend URL

That's it. Railway will handle the rest.

## API Endpoints

**Auth**
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**Projects**
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project (admin only)
- `DELETE /api/projects/:id` - Delete project (admin only)

**Tasks**
- `GET /api/projects/:id/tasks` - List tasks
- `POST /api/projects/:id/tasks` - Create task
- `PATCH /api/projects/:id/tasks/:taskId` - Update task
- `DELETE /api/projects/:id/tasks/:taskId` - Delete task

**Dashboard**
- `GET /api/dashboard` - Get personal stats

## Database

Tables: users, projects, project_members, tasks

See `backend/src/db/index.js` for the schema.

## Notes

- `.env` files are git-ignored, don't commit them
- Copy `.env.example` and fill in your own values
- JWT secret should be something strong in production
- Members can only edit tasks assigned to them, admins can edit everything
>>>>>>> 75850ed (first commit)
