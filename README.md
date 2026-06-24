# IKChatMeet 💬

A full-stack real-time chat application inspired by Instagram Direct Messages, built with React, Node.js, MongoDB, and Socket.io.

> Created by **Ishant Kshirsagar**

---

## 🚀 Live Demo

> Coming Soon — Deployment in progress!

---

## 📸 Screenshots

><img width="1920" height="1200" alt="Screenshot (590)" src="https://github.com/user-attachments/assets/0d82c846-b460-4060-9945-f644c27ae616" />


---

## ✨ Features

- 🔐 **Secure Authentication** — Register & login with JWT + bcrypt password hashing
- 🔍 **User Search** — Search any user by username and send follow request
- 👥 **Follow System** — Send, accept, or decline follow requests (like Instagram private accounts)
- 💬 **Real-Time Messaging** — Instant messaging powered by Socket.io
- 🟢 **Online/Offline Status** — See who is active with live green presence indicator
- 🔔 **Notifications** — Bell icon with live count for pending follow requests
- ⏳ **Disappearing Messages** — Set messages to auto-delete after 24 hours or 7 days
- 🖼️ **Profile Editing** — Update username, email, password, and profile picture
- 🌙 **Dark Theme** — Sleek Instagram-inspired sophisticated dark UI
- 📱 **Responsive Design** — Works on both desktop and mobile screens

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Real-time | Socket.io |
| Auth | JWT + bcrypt |
| Language | TypeScript |

---

## 📁 Project Structure

```
ikchatmeet/
├── backend/
│   ├── models/
│   │   ├── User.ts
│   │   ├── Follow.ts
│   │   └── Message.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── follow.ts
│   │   └── search.ts
│   ├── middleware.ts
│   └── db.ts
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── EditProfileModal.tsx
│   │   ├── NotificationsPopover.tsx
│   │   └── UserCard.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Chat.tsx
│   │   └── Search.tsx
│   ├── App.tsx
│   ├── socket.ts
│   └── main.tsx
├── server.ts
├── .env
└── package.json
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (free tier)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/ikchatmeet.git
cd ikchatmeet
```

**2. Install dependencies**
```bash
npm install
```

**3. Create `.env` file in root folder**
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ikchatmeet
JWT_SECRET=your_secret_key_here
```

**4. Run the app**
```bash
npm run dev
```

**5. Open in browser**
```
http://localhost:3000
```

---

## 🔌 How Real-Time Works

- Every user joins a **private Socket.io room** on login
- Chat room ID is generated as: `sorted([userId1, userId2]).join('_')`
- Both users join the same room — messages are delivered instantly
- Online/Offline status updates automatically on connect/disconnect

---

## 🗄️ MongoDB Collections

| Collection | Fields |
|-----------|--------|
| Users | username, email, password, avatar, isOnline |
| Follows | follower, following, status (pending/accepted) |
| Messages | roomId, sender, text, timestamp, expiresAt |

---

## 🙋‍♂️ Author

**Ishant Kshirsagar**


---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

⭐ **If you liked this project, please give it a star!** ⭐
