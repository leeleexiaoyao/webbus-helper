const API_BASE = "";

class ApiClient {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (response.status === 401) {
      // 跳转登录页
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("UNAUTHORIZED");
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "请求失败");
    }
    return data;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      body: formData,
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("UNAUTHORIZED");
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "上传失败");
    }
    return data;
  }
}

export const api = new ApiClient();
