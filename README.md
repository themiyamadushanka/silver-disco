# SignBridge AI: MediaPipe Hand Tracking & Mute Sign Language Translator

Real-time computer vision application that tracks 21 3D hand landmarks via webcam, understands hand gestures used by mute individuals, and translates them into spoken voice and subtitles for hearing individuals. Built with **Next.js (JavaScript)** and a modular **FastAPI** backend.

---

## ⚡ Quick Start for Developers (Zero-Error Setup)

When another developer clones this repository:

```bash
# 1. Clone repository
git clone https://github.com/themiyamadushanka/silver-disco.git
cd silver-disco

# 2. Install all dependencies (installs both root & frontend packages automatically)
npm install

# 3. Start development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🛠️ Available NPM Scripts (Run from Root)

You can run everything directly from the project root:

| Command | Action |
| :--- | :--- |
| `npm install` | Installs root & frontend dependencies automatically |
| `npm run dev` | Starts the Next.js frontend dev server (`http://localhost:3000`) |
| `npm run dev:backend` | Starts the FastAPI backend dev server (`http://127.0.0.1:8000`) |
| `npm run build` | Builds the Next.js production bundle |
| `npm run start` | Runs the Next.js production server |
| `npm run lint` | Runs ESLint on frontend code |

---

## 🚀 One-Click Setup Scripts

We also provide automated setup scripts:

- **Windows**: Double-click `setup.bat` (automatically creates Python `.venv`, installs requirements, and runs `npm install`). To launch both servers at once, double-click `start.bat`.
- **macOS / Linux**: Run `./setup.sh` in your terminal.

---

## 📁 Clean & Understandable File Structure

```text
silver-disco/
├── package.json                   # Root package.json (npm run dev & npm install from root)
├── setup.bat                      # 1-Click setup script for Windows
├── setup.sh                       # 1-Click setup script for Linux/macOS
├── start.bat                      # 1-Click launcher for both servers
├── .gitignore                     # Git ignore rules for venv, node_modules, and cache
├── README.md                      # Documentation
│
├── frontend/                      # Next.js App Router (JavaScript)
│   ├── package.json               # Frontend dependencies (next, react, eslint)
│   ├── next.config.mjs            # Next.js configuration
│   ├── jsconfig.json              # Path aliases (@/*)
│   ├── public/                    # Static SVG and image assets
│   └── src/
│       ├── app/
│       │   ├── layout.js          # Root layout and font configurations
│       │   ├── page.js            # Main dashboard connecting camera and tracker
│       │   └── globals.css        # Futuristic custom CSS design system
│       ├── components/
│       │   ├── HandCamera.js      # Webcam feed & MediaPipe 21-point skeleton canvas
│       │   ├── PositionTracker.js # Live 3D Cartesian coordinates (X, Y, Z) table
│       │   ├── GestureTranslator.js# Sign recognition, TTS voice synthesizer & sentence builder
│       │   ├── GestureGuide.js    # Reference dictionary of all supported signs
│       │   ├── Header.js          # Top navbar with status badge
│       │   └── StatusCard.js      # Backend diagnostic inspector
│       └── lib/
│           ├── mediapipe.js       # Dynamic MediaPipe script loader
│           ├── gestureDetector.js # 3D math, Euclidean distance & gesture classifier
│           ├── speech.js          # Web Speech Synthesis API audio translator
│           └── api.js             # Fetch wrapper for FastAPI backend
│
└── backend/                       # Python FastAPI Backend
    ├── requirements.txt           # fastapi, uvicorn, pydantic
    ├── run.py                     # Dev runner (python run.py)
    ├── .env.example               # Environment variables template
    └── app/
        ├── main.py                # FastAPI app entry point & CORS configuration
        ├── core/config.py         # Settings (CORS origins, API prefix)
        ├── schemas/               # Pydantic data validation schemas
        └── api/v1/                # Modular API v1 routers and endpoints
```

---

## 🤟 Supported Hand Signs & Translations

| Gesture | Pose Action | Translated Voice Output |
| :--- | :--- | :--- |
| **Hello / Open Hand** 🖐️ | All 5 fingers extended upright | *"Hello! Greetings!"* |
| **I Love You** 🤟 | Thumb + Index + Pinky extended | *"I love you"* |
| **Thumbs Up** 👍 | Thumb pointing upwards, fist closed | *"Yes, good"* |
| **Thumbs Down** 👎 | Thumb pointing downwards, fist closed | *"No, bad"* |
| **Peace / Victory** ✌️ | Index + Middle extended in V | *"Peace"* |
| **OK / All Good** 👌 | Thumb and Index tip pinched together | *"Everything is okay"* |
| **Call Me** 🤙 | Thumb and Pinky extended | *"Call me"* |
| **Pointing** 👉 | Index finger extended only | *"Look at this"* |
| **Closed Fist** ✊ | All fingers curled firmly | *"Stop or wait"* |

---

## 💻 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Pure JavaScript (`.js`/`.jsx`)
- **Computer Vision**: Google MediaPipe Hands (Client-side WebAssembly & GPU acceleration)
- **Audio Output**: Web Speech Synthesis API
- **Styling**: Vanilla CSS Design Tokens (Dark Mode, Glassmorphic translucent panels)
- **Backend**: Python FastAPI with Uvicorn and Pydantic v2
