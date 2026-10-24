import sys
import uvicorn

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

if __name__ == "__main__":
    print("[FastAPI] Starting server on http://127.0.0.1:8000 ...")
    print("[FastAPI] Swagger Docs at: http://127.0.0.1:8000/docs")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
