from typing import Optional
from pydantic import BaseModel

class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None

class ItemResponse(ItemBase):
    id: int
    created_at: str

    class Config:
        from_attributes = True
