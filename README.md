# 🤖 SimBot

> Voice-controlled humanoid robot simulation. Talk to an AI robot in a 3D digital home.

![SimBot](https://img.shields.io/badge/SimBot-v1.0-00d4ff?style=for-the-badge) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)

SimBot is an interactive 3D simulation where you control a humanoid robot using your voice. Speak commands like "clean the kitchen" or "make the bed" and watch the robot navigate a virtual home, reason about tasks, and complete them in real-time.

## ✨ Features

- **🎤 Voice Control** — Talk to the robot using your browser's microphone
- **🏠 3D Home Environment** — Navigate a fully furnished apartment (living room, kitchen, bedroom, bathroom)
- **🤖 Animated Robot** — Cyberpunk-styled humanoid with idle, walking, and working animations
- **📋 Task System** — Give natural language commands and watch them execute
- **📱 Mobile Responsive** — Works on phones and tablets with touch controls
- **🎮 Demo Mode** — Auto-runs tasks to showcase the simulation
- **🌙 Dark Cyberpunk Theme** — Sleek, futuristic UI design

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/kspringfield13/simbot.git
cd simbot

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser (Chrome recommended for voice).

## 🌐 Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect the GitHub repo to [vercel.com](https://vercel.com) for automatic deployments.

## 🗣️ Voice Commands

| Command | Action |
|---------|--------|
| "Clean the kitchen" | Robot navigates to kitchen and cleans |
| "Make the bed" | Robot goes to bedroom and makes the bed |
| "Scrub the bathroom" | Robot cleans the bathroom |
| "Organize the desk" | Robot tidies the desk area |
| "Tidy up the living room" | Robot cleans the living room |

## 🛠️ Tech Stack

- **React** + **TypeScript** + **Vite**
- **Three.js** via React Three Fiber
- **Zustand** for state management
- **Web Speech API** for voice recognition
- **Tailwind CSS** for styling

## 🗺️ Roadmap

- [x] Mini-games — cooking, repair puzzles, garden tending with bonus coins (2026-03-01)
- [x] Robot aging/evolution — 5-stage progression with visual upgrades ✅ (3/1)
- [x] Smart scheduling AI — learns optimal cleaning patterns from user behavior ✅ (3/1)
- [ ] LLM-powered task reasoning (OpenAI/local LLM)
- [ ] Room scanning from photos/video (spatial mapping)
- [ ] Custom furniture placement
- [ ] Multi-robot support
- [ ] Task learning and memory
- [ ] Integration with smart home devices

## 📄 License

MIT
