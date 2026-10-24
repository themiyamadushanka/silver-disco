const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

/**
 * Helper to perform fetch requests with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP Error ${response.status}: ${response.statusText}`);
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error(`API Request Failed [${options.method || "GET"} ${endpoint}]:`, err);
    throw err;
  }
}

/**
 * Health check endpoint call with latency measurement
 */
export async function checkHealth() {
  const startTime = performance.now();
  try {
    const data = await request("/health");
    const latency = Math.round(performance.now() - startTime);
    return { success: true, latency, data };
  } catch (error) {
    return { success: false, latency: null, error: error.message };
  }
}

/**
 * Fetch all items from FastAPI
 */
export async function fetchItems() {
  return await request("/items");
}

/**
 * Create a new item
 */
export async function createItem(itemData) {
  return await request("/items", {
    method: "POST",
    body: JSON.stringify(itemData),
  });
}

/**
 * Update existing item (e.g. toggle completed)
 */
export async function updateItem(id, updates) {
  return await request(`/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/**
 * Delete an item
 */
export async function deleteItem(id) {
  return await request(`/items/${id}`, {
    method: "DELETE",
  });
}

export { API_BASE_URL };
