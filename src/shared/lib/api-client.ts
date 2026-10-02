import axios from "axios";

export const apiClient = axios.create({
  baseURL: "",
  withCredentials: true,
});

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) {
      return data.error;
    }
  }
  return fallback;
}
