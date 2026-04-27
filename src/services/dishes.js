import { userStorage } from "./userStorage.js";

function request(method, body) {
  const headers = {
    "Content-Type": "application/json",
    "x-username": userStorage.getUsername() || ""
  };
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return fetch("/api/dishes", options)
    .then(res => {
      if (res.status === 204) return null;
      if (!res.ok) {
        return res.json().then(data => {
          throw new Error(data.error || `HTTP ${res.status}`);
        });
      }
      return res.json();
    });
}

export async function loadDishes(category) {
  const url = category ? `/api/dishes?category=${category}` : "/api/dishes";
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function createDish(dish) {
  return request("POST", dish);
}

export async function updateDish(dish) {
  return request("PATCH", dish);
}

export async function deleteDish(id) {
  return fetch(`/api/dishes?id=${id}`, {
    method: "DELETE",
    headers: {
      "x-username": userStorage.getUsername() || ""
    }
  }).then(res => {
    if (!res.ok) {
      return res.json().then(data => {
        throw new Error(data.error || `HTTP ${res.status}`);
      });
    }
  });
}
