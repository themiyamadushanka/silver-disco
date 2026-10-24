# Next.js (JS) + FastAPI Full-Stack Starter

A clean, modern, and easily understandable full-stack template featuring a **Next.js (JavaScript)** frontend and a **FastAPI** backend with a modular directory structure.

---

## 📁 Project Architecture & Directory Structure

```text
newProjet/
├── backend/                       # Python FastAPI Backend
│   ├── .venv/                     # Python Virtual Environment
│   ├── requirements.txt           # Backend dependencies (fastapi, uvicorn, pydantic)
│   ├── run.py                     # Convenience startup script (python run.py)
│   ├── .env.example               # Environment variables template
│   └── app/
│       ├── __init__.py
│       ├── main.py                # FastAPI entry point & CORS configuration
│       ├── core/
│       │   ├── __init__.py
│       │   └── config.py          # App settings (CORS, API prefix, version)
│       ├── schemas/
│       │   ├── __init__.py
│       │   ├── health.py          # Pydantic model for health check response
│       │   └── item.py            # Pydantic models for item CRUD
│       └── api/
│           ├── __init__.py
│           └── v1/
│               ├── __init__.py
│               ├── router.py      # Combines feature routers into /api/v1
│               └── endpoints/
│                   ├── __init__.py
│                   ├── health.py  # GET /api/v1/health
│                   └── items.py   # Full CRUD (/api/v1/items)
│
├── frontend/                      # Next.js App Router (JavaScript)
│   ├── package.json               # Dependencies and npm scripts
│   ├── next.config.mjs            # Next.js configuration
│   ├── jsconfig.json              # Path aliases (@/*)
│   ├── .env.local.example         # Frontend environment template
│   ├── public/                    # Static assets
│   └── src/
│       ├── app/
│       │   ├── layout.js          # Root layout with fonts & metadata
│       │   ├── page.js            # Main dashboard & interactive demo
│       │   └── globals.css        # Rich custom CSS design system
│       ├── components/
│       │   ├── Header.js          # Top navigation bar with backend status badge
│       │   ├── StatusCard.js      # Diagnostic inspector for FastAPI health
│       │   ├── ItemManager.js     # Full CRUD demo connecting to FastAPI
│       │   └── ItemCard.js        # Item card with toggle & delete actions
│       └── lib/
│           └── api.js             # API helper client for backend requests
│
└── README.md                      # This documentation guide
```

---

## 🚀 Getting Started

### 1. Run the FastAPI Backend

Open a terminal in the `backend/` directory:

```bash
# Navigate to backend
cd backend

# Activate virtual environment
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# (Optional: install dependencies if not already installed)
pip install -r requirements.txt

# Start the server
python run.py
```

The backend will start at:
- **API Root**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **API v1 Health Endpoint**: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- **API v1 Items Endpoint**: [http://127.0.0.1:8000/api/v1/items](http://127.0.0.1:8000/api/v1/items)

---

### 2. Run the Next.js Frontend

Open a second terminal in the `frontend/` directory:

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if needed)
npm install

# Start the Next.js development server
npm run dev
```

The frontend will start at:
- **Web App**: [http://localhost:3000](http://localhost:3000)

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API welcome & documentation links |
| `GET` | `/api/v1/health` | Health check with server timestamp & status |
| `GET` | `/api/v1/items` | List all items |
| `POST` | `/api/v1/items` | Create a new item (`title`, `description`) |
| `GET` | `/api/v1/items/{id}` | Get item by ID |
| `PUT` | `/api/v1/items/{id}` | Update item details or `completed` flag |
| `DELETE` | `/api/v1/items/{id}` | Delete item by ID |

---

## 💡 Key Architectural Highlights

1. **Clean Separation of Concerns**: Frontend and Backend are decoupled, allowing independent development and deployment.
2. **Versioned API Structure**: FastAPI routes are structured inside `app/api/v1/`, making it effortless to add new endpoints without cluttering the main app.
3. **Pydantic Validation**: All requests and responses are strictly validated using Pydantic models in `app/schemas/`.
4. **App Router & Pure JavaScript**: The Next.js project is configured with modern React 19 / Next.js App Router using pure JavaScript (`.js`/`.jsx`) without TypeScript overhead.
5. **Direct End-to-End Integration**: The frontend includes live health polling and interactive CRUD controls that directly communicate with the backend.
