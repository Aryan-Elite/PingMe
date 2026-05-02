# PingMe

A real-time chat and notification platform. Users can register, log in, chat 1-on-1 in rooms, and receive live notifications — all powered by WebSocket.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Real-time:** Socket.io (two namespaces: `/chat` and `/notifications`)
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (access token + refresh token in httpOnly cookie)
- **DevOps:** Docker, Docker Compose, GitHub Actions CI/CD, AWS EC2

---

## Instructions for Building (Practice Mode)

This is a practice project. Figure out the implementation yourself — use docs, not copy-paste.

### Phase 1 — Project Setup
- Initialize a Node.js project with Express
- Set up folder structure: `routes/`, `controllers/`, `models/`, `middleware/`, `socket/`
- Connect to MongoDB using Mongoose
- Load environment variables from `.env` using `dotenv`

### Phase 2 — Auth (JWT)
- Create `User` model with username, email, hashed password
- Build register + login routes
- On login: sign an **access token** (short expiry) and a **refresh token** (long expiry)
- Store refresh token in an httpOnly cookie — understand *why* this is safer than localStorage
- Create an auth middleware that verifies the access token on protected routes
- Build a `/auth/refresh` route that reads the cookie and issues a new access token

### Phase 3 — MongoDB Schema for Chat
- Think about: should messages be embedded in a room document or stored in a separate collection?
- Create `Room` model (which two users are in it)
- Create `Message` model (which room, who sent it, what content, when)
- Add an index on messages — think about what fields you'd query by when fetching chat history

### Phase 4 — Socket.io: Chat Namespace
- Set up Socket.io on your Express server
- Create a `/chat` namespace
- On connection: verify the JWT passed in the socket handshake auth
- Handle these events: `join` (join a room), `message` (broadcast to room + save to DB), `typing`
- Test with two browser tabs or Postman WebSocket client

### Phase 5 — Socket.io: Notifications Namespace
- Create a `/notifications` namespace
- On connect: use the userId as a room name so you can target a specific user
- Emit a notification from the chat handler when a new message arrives (notify the recipient)
- Think about notification shape: `{ type, message, from, timestamp }`

### Phase 6 — Dockerize
- Write a `Dockerfile` for the Node.js app (use alpine image, copy only what's needed)
- Write a `docker-compose.yml` with two services: app + mongo
- Pass secrets via environment variables, not hardcoded
- Test: `docker-compose up` should start everything and the app should connect to Mongo

### Phase 7 — GitHub Actions CI/CD
- Create `.github/workflows/deploy.yml`
- Trigger on push to `main`
- Steps: checkout code → install deps → run tests → SSH into EC2 → pull latest + restart containers
- Store EC2 private key and host in GitHub Secrets

### Phase 8 — Deploy to EC2
- Launch an Ubuntu EC2 instance (free tier)
- Install Docker + Docker Compose on it
- Open port 3000 in the Security Group
- SSH in and run your Compose setup manually first, then automate it via GitHub Actions

### Phase 9 — Minimal React Frontend
- Login form → POST to `/auth/login` → store access token in memory
- Chat page → connect to `/chat` namespace with token in auth header
- Show messages, send message, show typing indicator
- Notification bell → connect to `/notifications`, show count

---

## Key Things to Be Able to Explain in the Interview
- Why httpOnly cookie for refresh token
- How you decided to structure the MongoDB schema (embed vs reference)
- Why you added an index on the messages collection and on which fields
- How Socket.io namespaces work and why you used two
- How the GitHub Actions pipeline deploys to EC2
- What Docker Compose is doing (services, networking, volumes)
