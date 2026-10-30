import type { Connect } from "vite";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export interface StayNestUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "Tenant" | "Property Owner";
}

interface SupabaseUser {
  id: string;
  email: string;
}

interface SupabaseAuthResponse {
  access_token?: string;
  user?: SupabaseUser;
  error?: string;
  code?: string | number;
  msg?: string;
}

function json(res: unknown, status = 200): Response {
  return new Response(JSON.stringify(res), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function supabaseFetch(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { status: res.status, body };
}

async function getProfile(userId: string): Promise<StayNestUser | null> {
  const { body } = await supabaseFetch(`/rest/v1/profiles?id=eq.${userId}&select=id,full_name,phone,role,email`, {
    headers: { Accept: "application/vnd.pgrst.object+json" },
  });
  if (!body || body.id !== userId) {
    // email isn't stored on profiles; fetch from auth
    return null;
  }
  return body as StayNestUser;
}

async function buildUser(authUser: SupabaseUser): Promise<StayNestUser> {
  const { body: profile } = await supabaseFetch(
    `/rest/v1/profiles?id=eq.${authUser.id}&select=id,full_name,phone,role`,
    { headers: { Accept: "application/vnd.pgrst.object+json" } },
  );
  return {
    id: authUser.id,
    email: authUser.email,
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    role: profile?.role ?? "Tenant",
  };
}

function verifyEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function verifyPhone(phone: unknown): phone is string {
  return typeof phone === "string" && /^[6-9]\d{9}$/.test(phone);
}

function verifyPassword(pw: unknown): pw is string {
  return typeof pw === "string" && pw.length >= 8 && /[a-zA-Z]/.test(pw) && /\d/.test(pw);
}

export function supabaseAuthServer(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = new URL(req.url || "", "http://localhost");
    const pathname = url.pathname;

    if (!pathname.startsWith("/api/auth")) {
      (next as () => void)();
      return;
    }

    // Collect JSON body
    let body: any = {};
    if (req.method === "POST") {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const raw = Buffer.concat(chunks).toString("utf-8");
        body = raw ? JSON.parse(raw) : {};
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: "Invalid JSON body." }));
        return;
      }
    }

    try {
      // ---- SIGN UP ----
      if (pathname === "/api/auth/signup" && req.method === "POST") {
        const { fullName, email, phone, role, password } = body;
        const errors: string[] = [];
        if (typeof fullName !== "string" || fullName.trim().length < 2) errors.push("Full name must be at least 2 characters.");
        if (!verifyEmail(email)) errors.push("Please enter a valid email address.");
        if (!verifyPhone(phone)) errors.push("Mobile number must be a 10-digit Indian number starting with 6-9.");
        if (role !== "Tenant" && role !== "Property Owner") errors.push("Role must be 'Tenant' or 'Property Owner'.");
        if (!verifyPassword(password)) errors.push("Password must be at least 8 characters with at least one letter and one number.");
        if (errors.length) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, errors }));
          return;
        }

        // Check email not already registered
        const { status: dupStatus, body: dupBody } = await supabaseFetch(
          `/auth/v1/signup`,
          {
            method: "POST",
            body: JSON.stringify({ email, password, data: { full_name: fullName, phone, role } }),
          },
        );
        // Supabase signup returns 200 with a user object; if email exists and email confirm is on,
        // it may return a fake user. Since email confirm is OFF in our config, a real user is created.
        if (dupStatus >= 400) {
          const msg = dupBody?.msg || dupBody?.error_description || dupBody?.error || "Sign-up failed.";
          if (/already|exists|registered/i.test(String(msg)) || dupStatus === 422) {
            res.statusCode = 409;
            res.end(JSON.stringify({ success: false, error: "An account with this email already exists. Please log in." }));
            return;
          }
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: msg }));
          return;
        }

        const newUser = dupBody?.user as SupabaseUser | undefined;
        if (!newUser || !newUser.id) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: "Could not create account. Please try again." }));
          return;
        }

        // Insert profile row
        await supabaseFetch(`/rest/v1/profiles`, {
          method: "POST",
          body: JSON.stringify({
            id: newUser.id,
            full_name: fullName.trim(),
            phone,
            role,
          }),
          headers: { Prefer: "return=minimal" },
        });

        const accessToken = dupBody.access_token;
        const user = await buildUser(newUser);
        res.statusCode = 201;
        res.end(JSON.stringify({ success: true, token: accessToken, user }));
        return;
      }

      // ---- LOGIN ----
      if (pathname === "/api/auth/login" && req.method === "POST") {
        const { email, password } = body;
        if (!verifyEmail(email) || typeof password !== "string" || !password) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: "Please enter a valid email and password." }));
          return;
        }

        const { status, body: authBody } = await supabaseFetch(`/auth/v1/token?grant_type=password`, {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        if (status >= 400 || !authBody.access_token) {
          res.statusCode = 401;
          const msg = authBody?.msg || authBody?.error_description || authBody?.error || "Invalid email or password.";
          res.end(JSON.stringify({ success: false, error: msg }));
          return;
        }

        const authUser = authBody.user as SupabaseUser;
        const user = await buildUser(authUser);
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, token: authBody.access_token, user }));
        return;
      }

      // ---- ME ----
      if (pathname === "/api/auth/me" && req.method === "GET") {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
        if (!token || !token.startsWith("Bearer ")) {
          res.statusCode = 401;
          res.end(JSON.stringify({ success: false, error: "Not authenticated." }));
          return;
        }
        const jwt = token.replace(/^Bearer\s+/i, "");
        const { status, body: meBody } = await supabaseFetch(`/auth/v1/user`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (status >= 400 || !meBody.id) {
          res.statusCode = 401;
          res.end(JSON.stringify({ success: false, error: "Session expired. Please log in again." }));
          return;
        }
        const user = await buildUser(meBody as SupabaseUser);
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, user }));
        return;
      }

      // unknown auth route
      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, error: "Unknown auth endpoint." }));
      return;
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: "Something went wrong. Please try again." }));
      return;
    }
  };
}
