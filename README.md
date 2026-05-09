# 💬 LiveChat — Real-time Chat & Video Calling App

> A production-grade full-stack chat application with real-time messaging, WebRTC video/audio calling, group chats, and in-call messaging. Deployed on AWS EC2 with a custom domain and GitHub Actions CI/CD.

[![Live Demo](https://img.shields.io/badge/Live_Demo-22c55e?style=for-the-badge&logo=googlechrome&logoColor=white)](https://livechat.lyxcorp.com/)
[![Server Repo](https://img.shields.io/badge/Server_Repo-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/prashantsingh-codes/live-chat-server)

---

## 📸 What is LiveChat?

LiveChat is a real-time communication platform where users can send messages, make video and audio calls, and chat during calls — all in one place. It uses WebRTC for peer-to-peer calling via SimplePeer, Socket.io for real-time events, and is deployed on AWS EC2 behind Nginx with a custom domain.

---

## ✨ Features

### 💬 Messaging
- **Real-time messaging** with Socket.io — no refresh needed
- **One-on-one chats** and **group chats**
- **Typing indicator** — see when the other person is typing
- **Media uploads** — share images and files in chat
- Messages persist in MongoDB — full chat history on reload

### 📞 Video & Audio Calling
- **One-on-one video calls** using WebRTC + SimplePeer
- **Audio-only calls** for voice communication
- **In-call chat panel** — send messages during an active call
- **Mute / unmute** microphone during call
- **Camera on / off** toggle
- Picture-in-picture local video preview
- TURN server support for calls across different networks

### 👥 Groups
- Create group chats with multiple users
- Group admin controls
- Add members to existing groups

### 🔐 Authentication
- JWT-based login and signup
- Passwords hashed with bcrypt
- Persistent sessions — stay logged in across refreshes

### 🌙 Dark / Light Mode
- Full dark mode support
- Theme persists across sessions via localStorage

### ☁️ Deployment
- **AWS EC2** — Node.js backend running via PM2
- **Nginx** — reverse proxy with SSL
- **Custom domain** — [livechat.lyxcorp.com](https://livechat.lyxcorp.com/)
- **GitHub Actions** — automated CI/CD pipeline on every push to `main`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| State Management | Redux Toolkit |
| Real-time | Socket.io Client |
| Video Calling | WebRTC, SimplePeer |
| Styling | CSS (custom, no framework) |
| Auth | JWT + bcryptjs |
| Backend | Node.js, Express *(see server repo)* |
| Database | MongoDB Atlas *(see server repo)* |
| Hosting | AWS EC2 + Nginx |
| CI/CD | GitHub Actions |

---

## 📁 Project Structure

```
live-chat-client/
├── .github/workflows/     ← GitHub Actions deploy pipeline
├── src/
│   ├── App.jsx            ← Routes + socket init
│   ├── pages/
│   │   ├── Login.jsx
│   │   └── MainContainer.jsx
│   ├── components/
│   │   ├── ChatArea.jsx   ← Main chat window
│   │   ├── CallModal.jsx  ← Video/audio call UI
│   │   ├── Users.jsx
│   │   ├── Groups.jsx
│   │   ├── Welcome.jsx
│   │   └── CreateGroups.jsx
│   ├── context/
│   │   ├── ChatContext.jsx   ← User data, API calls
│   │   └── CallContext.jsx   ← WebRTC, call state
│   └── redux/
│       ├── store.js
│       └── themeSlice.js
├── index.html
├── vite.config.js
└── vercel.json
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- [live-chat-server](https://github.com/prashantsingh-codes/live-chat-server) running locally

### 1. Clone the repo

```bash
git clone https://github.com/prashantsingh-codes/live-chat-client.git
cd live-chat-client
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

```env
VITE_BACKEND_URL=http://localhost:5000
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

> Make sure the backend server is running on port 5000 before starting the client.

---

## ⚙️ GitHub Actions — CI/CD

Every push to `main` automatically:
1. SSHs into the AWS EC2 instance
2. Pulls the latest code
3. Installs dependencies and builds the React app
4. Reloads Nginx to serve the new build

Pipeline config lives in `.github/workflows/deploy.yml`.

---

## 🔗 Related

- **Backend repo** → [live-chat-server](https://github.com/prashantsingh-codes/live-chat-server)
- **Live app** → [livechat.lyxcorp.com](https://livechat.lyxcorp.com/)

---

## 📄 License

MIT — free to use, modify, and deploy.

---

Built with ☕ by [Prashant Singh](https://www.linkedin.com/in/prashant-singh-079237192/)
