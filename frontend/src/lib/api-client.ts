import axios, { AxiosInstance, AxiosError } from 'axios';

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

interface ApiError {
  code: number;
  message: string;
  errors?: Record<string, unknown>;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器：添加 token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // 响应拦截器：处理错误
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // 处理未授权，清除 token 并重定向到登录
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * GET 请求
   */
  async get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST 请求
   */
  async post<T = unknown>(url: string, data?: unknown): Promise<T> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PATCH 请求
   */
  async patch<T = unknown>(url: string, data?: unknown): Promise<T> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE 请求
   */
  async delete<T = unknown>(url: string): Promise<T> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 设置 token
   */
  setToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  /**
   * 获取 token
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  /**
   * 清除 token
   */
  clearToken() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * 错误处理
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error) && error.response?.data) {
      const apiError = error.response.data as ApiError;
      return new Error(apiError.message);
    }
    return error instanceof Error ? error : new Error('未知错误');
  }
}

export const apiClient = new ApiClient();

export const analyticsClient = new ApiClient(
  process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'http://localhost:3010/api/v2',
);
