# WorkYaar

WorkYaar is a job portal project with a Node.js/Express backend and a static HTML/CSS/JavaScript frontend.

## Project Structure

```text
workyaar/
  backend/
    app.js                 # Express server entrypoint
    config/                # Database and upload configuration
    controllers/           # API controller logic
    middlewares/           # Auth, role, and upload middleware
    routes/                # API route definitions
    services/              # Shared backend services
    scripts/               # Database/setup helper scripts
    uploads/               # Runtime uploaded files
    package.json           # Backend dependencies and scripts

  frontend/
    public/
      *.html               # Static frontend pages
      css/
        global.css          # Shared design system and reusable components
        pages/              # Page-specific stylesheets for each HTML page
      js/                  # Browser JavaScript
      images/              # Frontend image assets

  config/                  # Original working copy kept as a backup
  package.json             # Root scripts for running the backend
```

## Run The Project

Install backend dependencies:

```bash
cd backend
npm install
```

Start the server from the project root:

```bash
npm start
```

For development with nodemon:

```bash
npm run dev
```

The backend runs on `http://localhost:5002` and serves the frontend from `frontend/public`.

## Main URLs

- Frontend: `http://localhost:5002`
- Health check: `http://localhost:5002/health`
- API routes: `http://localhost:5002/api/...`
