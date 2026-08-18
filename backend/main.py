from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from modules.comics.router import router as comics_router
from modules.chapters.router import router as chapters_router
from modules.images.router import router as images_router
from modules.search.router import router as search_router

app = FastAPI(title="HManga Library API")

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thư mục chứa cover images và frontend
COVER_DIR = Path(__file__).parent.parent / "cover-images"
COVER_DIR.mkdir(parents=True, exist_ok=True)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
FRONTEND_DIR.mkdir(parents=True, exist_ok=True)

# 1. Đăng ký API routes
app.include_router(comics_router)
app.include_router(chapters_router)
app.include_router(images_router)
app.include_router(search_router)

# 2. Mount thư mục static cho cover images
app.mount("/api/covers", StaticFiles(directory=str(COVER_DIR)), name="covers")

# 3. Mount thư mục static cho Frontend (HTML, CSS, JS)
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
