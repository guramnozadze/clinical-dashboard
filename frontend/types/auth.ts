// Mirrors app/schemas/user.py on the FastAPI side.

export interface Token {
  access_token: string;
  token_type: "bearer";
}

export interface User {
  user_id: string; // UUID
  username: string;
}

/** Body accepted by the Next.js /api/auth/login route handler. */
export interface LoginCredentials {
  username: string;
  password: string;
}
