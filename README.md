# Salt & Char — Restaurant Website

A full restaurant website with a separate **frontend** (static HTML/CSS/JS)
and **backend** (Node.js + Express REST API). The backend also serves the
frontend, so running one command gets you the whole site.

```
restaurant-website/
├── backend/
│   ├── server.js         # Express server + API routes
│   ├── package.json
│   └── data/
│       ├── menu.json          # Menu items (editable)
│       ├── reservations.json  # Reservations get appended here
│       └── messages.json      # Contact messages get appended here
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/script.js
```

## Running it

1. Install Node.js 18+ if you don't already have it.
2. Open a terminal in the `backend` folder and install dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open your browser to **http://localhost:3000** — this loads the frontend
   and talks to the API automatically.

You can change the port with `PORT=4000 npm start` if 3000 is taken.

## API reference

| Method | Route              | Description                                   |
|--------|---------------------|------------------------------------------------|
| GET    | `/api/status`       | Whether the restaurant is currently open       |
| GET    | `/api/menu`          | Full menu (add `?category=Small%20Plates` to filter) |
| GET    | `/api/reservations`  | List all reservations (for staff use)          |
| POST   | `/api/reservations`  | Create a reservation (`name`, `email`, `phone`, `date`, `time`, `guests`, `notes`) |
| POST   | `/api/contact`       | Send a contact message (`name`, `email`, `message`) |

Data is stored in the JSON files under `backend/data/` — no database setup
required. For real production use, swap these files out for a proper
database (Postgres, MongoDB, etc.) and add authentication to the
`/api/reservations` GET route.

## Customizing

- **Menu:** edit `backend/data/menu.json` — the frontend fetches it live and
  builds the category tabs automatically.
- **Hours / open days:** edit the logic in `server.js` under `/api/status`.
- **Colors & fonts:** all design tokens are CSS variables at the top of
  `frontend/css/style.css`.
- **Restaurant details:** name, address, phone, and hours text live directly
  in `frontend/index.html`.

## Notes

- The frontend can also be opened directly as a static file, but reservation
  and contact forms need the backend running on `localhost:3000` to work.
- `cors` is enabled on the backend so the frontend can be hosted separately
  from the API if you choose to split deployment later.
