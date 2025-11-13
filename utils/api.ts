const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://weintegrity-ppm.onrender.com/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private setAuthToken(token: string | null): void {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle empty responses (like 204 No Content)
      let data: any = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          // Response is not valid JSON, treat as empty
        }
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          this.setAuthToken(null);
          // Clear user data if token is invalid
          if (typeof window !== 'undefined') {
            localStorage.removeItem('currentUser');
          }
        }
        return {
          error: data.detail || data.message || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      // For 204 No Content, return success with no data
      if (response.status === 204) {
        return { data: undefined as T, status: response.status };
      }

      return { data: data as T, status: response.status };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const result = await this.request<{ access: string; user: any }>(
      '/auth/login/',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    if (result.data?.access) {
      this.setAuthToken(result.data.access);
    }
    return result;
  }

  async register(userData: any) {
    const result = await this.request<{ access: string; user: any }>(
      '/auth/register/',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
    if (result.data?.access) {
      this.setAuthToken(result.data.access);
    }
    return result;
  }

  async refreshToken() {
    const result = await this.request<{ access: string }>('/auth/refresh/', {
      method: 'POST',
    });
    if (result.data?.access) {
      this.setAuthToken(result.data.access);
    }
    return result;
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email: string, otp: string) {
    return this.request<{ message: string }>('/auth/verify-otp/', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/reset-password/', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  }

  logout() {
    this.setAuthToken(null);
  }

  // CRUD operations
  async get<T>(collection: string, id?: string, params?: Record<string, any>) {
    const queryParams = new URLSearchParams(params as any).toString();
    const endpoint = id
      ? `/${collection}/${id}/${queryParams ? `?${queryParams}` : ''}`
      : `/${collection}/${queryParams ? `?${queryParams}` : ''}`;
    return this.request<T>(endpoint);
  }

  async post<T>(collection: string, data: any) {
    return this.request<T>(`/${collection}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(collection: string, id: string, data: any) {
    return this.request<T>(`/${collection}/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(collection: string, id: string) {
    return this.request(`/${collection}/${id}/`, {
      method: 'DELETE',
    });
  }

  // Special endpoints
  async seedDatabase() {
    return this.request('/dev/seed/', {
      method: 'POST',
    });
  }

  // Chat endpoints
  async getStoryChats(storyId: string) {
    return this.request<{ storyId: string; messages: any[] }>(
      `/story-chats/${storyId}/`
    );
  }

  async postStoryChatMessage(storyId: string, message: any) {
    return this.request(`/story-chats/${storyId}/`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async deleteStoryChatMessage(storyId: string, messageId: string) {
    return this.request(`/story-chats/${storyId}/?messageId=${messageId}`, {
      method: 'DELETE',
    });
  }

  async getProjectChats(projectId: string) {
    return this.request<{ projectId: string; messages: any[] }>(
      `/project-chats/${projectId}/`
    );
  }

  async postProjectChatMessage(projectId: string, message: any) {
    return this.request(`/project-chats/${projectId}/`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async deleteProjectChatMessage(projectId: string, messageId: string) {
    return this.request(
      `/project-chats/${projectId}/?messageId=${messageId}`,
      {
        method: 'DELETE',
      }
    );
  }
}

export const api = new ApiService();

