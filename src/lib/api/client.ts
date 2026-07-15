export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, config: RequestInit = {}): Promise<T> {
  const headers = new Headers(config.headers);
  if (config.body && !(config.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...config, headers });

  let data: any;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.error || response.statusText, data);
  }

  return data as T;
}

export const api = {
  get: <T>(url: string, config?: RequestInit) =>
    request<T>(url, { ...config, method: "GET" }),
  post: <T>(url: string, body?: any, config?: RequestInit) =>
    request<T>(url, {
      ...config,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: any, config?: RequestInit) =>
    request<T>(url, {
      ...config,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string, body?: any, config?: RequestInit) =>
    request<T>(url, {
      ...config,
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
