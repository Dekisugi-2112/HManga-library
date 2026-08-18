"""
Database Client Module
======================
Khởi tạo và quản lý kết nối cơ sở dữ liệu Supabase.
Nhiệm vụ:
- Sử dụng supabase-py Client để kết nối với cơ sở dữ liệu Postgres trên Supabase Cloud.
- Export đối tượng `supabase` để các module service truy vấn dữ liệu.
"""

from supabase import create_client, Client
from core.config import settings

# Khởi tạo Supabase Client duy nhất sử dụng SERVICE_ROLE_KEY để thực hiện CRUD không bị chặn bởi RLS
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
