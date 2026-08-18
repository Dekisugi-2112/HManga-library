from pydantic import BaseModel

class AuthorRenameRequest(BaseModel):
    old_name: str
    new_name: str

class AuthorResponse(BaseModel):
    name: str
    comic_count: int
