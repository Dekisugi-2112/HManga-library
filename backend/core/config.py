import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Đường dẫn đến thư mục gốc của project (HManga-library)
BASE_DIR = Path(__file__).parent.parent.parent

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    model_config = SettingsConfigDict(
        env_file=os.path.join(BASE_DIR, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
