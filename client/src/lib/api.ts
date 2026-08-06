import axios from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sgt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiErrorShape {
  error: string;
  details?: unknown;
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorShape | undefined;
    if (data?.error) return data.error;
    if (err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
}
