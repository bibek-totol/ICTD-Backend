// src/types/AppErrorPayload.ts
export interface AppErrorPayload {
  scode?: number; // HTTP status code
  fnc: string; // function / API name
  msg?: string; // custom message (optional)
  error: unknown; // original error
}
