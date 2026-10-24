from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse

router = APIRouter()

# In-memory storage with sample initial data
items_db: List[dict] = [
    {
        "id": 1,
        "title": "Setup Next.js Frontend",
        "description": "JavaScript App Router with clean components & modern styles",
        "completed": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": 2,
        "title": "Configure FastAPI Backend",
        "description": "Modular folder structure with core, schemas, and v1 endpoints",
        "completed": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": 3,
        "title": "Connect Full-Stack API",
        "description": "Verify live status check and end-to-end CRUD operations",
        "completed": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
]

current_id_counter = 3

@router.get("", response_model=List[ItemResponse])
def list_items():
    """Retrieve all items."""
    return items_db

@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate):
    """Create a new item."""
    global current_id_counter
    current_id_counter += 1
    new_item = {
        "id": current_id_counter,
        "title": payload.title,
        "description": payload.description,
        "completed": payload.completed,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    items_db.append(new_item)
    return new_item

@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: int):
    """Retrieve single item by ID."""
    for item in items_db:
        if item["id"] == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@router.put("/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, payload: ItemUpdate):
    """Update an existing item."""
    for item in items_db:
        if item["id"] == item_id:
            if payload.title is not None:
                item["title"] = payload.title
            if payload.description is not None:
                item["description"] = payload.description
            if payload.completed is not None:
                item["completed"] = payload.completed
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int):
    """Delete an item by ID."""
    for index, item in enumerate(items_db):
        if item["id"] == item_id:
            items_db.pop(index)
            return
    raise HTTPException(status_code=404, detail="Item not found")
