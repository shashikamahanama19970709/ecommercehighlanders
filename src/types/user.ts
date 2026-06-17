export type UserRole = "admin" | "customer";

export interface AppUser {
  _id?: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role: UserRole;
  // For credentials logins only; hashed with bcrypt
  passwordHash?: string;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  lastVerificationResend?: number;
  createdAt?: string;
  updatedAt?: string;
}
