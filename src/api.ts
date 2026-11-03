const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export type User = {
  id?: number;
  username: string;
  email: string;
  token: string;
};

export type Product = {
  id: number;
  title: string;
  price: string;
  image_url?: string | null;
  link: string;
  rating?: string | null;
  reviews?: string | null;
};

type ApiError = { detail?: string };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.detail ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function signup(username: string, email: string, password: string) {
  return request<User>("/api/user/signup", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export function login(email: string, password: string) {
  return request<User>("/api/user/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function startScrape(startPage: number, endPage: number) {
  return request<{ message: string }>(
    `/api/products/scrape?start_page=${startPage}&end_page=${endPage}`,
  );
}

export function getProducts(page: number, limit: number) {
  return request<{ page: number; limit: number; total: number; data: Product[] }>(
    `/api/products/products?page=${page}&limit=${limit}`,
  );
}
