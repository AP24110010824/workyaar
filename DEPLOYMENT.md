# WorkYaar Deployment

## 1. Database

Open MySQL Workbench and run:

```sql
SOURCE database/workyaar_schema.sql;
```

Or paste the contents of `database/workyaar_schema.sql` into Workbench and execute it.

## 2. Environment

Copy `backend/.env.example` to `backend/.env` and fill the values:

```env
PORT=5002
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=workyaar_db
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
```

For production, set these variables in your hosting dashboard instead of committing `.env`.

## 3. Install

```bash
npm install
npm --prefix backend install
```

## 4. Run Locally

```bash
npm start
```

The app serves the frontend and backend from the same server:

- Website: `http://localhost:5002/`
- API health: `http://localhost:5002/health`

## 5. Deploy

Use the root package start command:

```bash
npm start
```

The server reads `process.env.PORT`, so platforms like Render/Railway can assign the port automatically.
