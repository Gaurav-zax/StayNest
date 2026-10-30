// Seed script: creates two demo accounts in Supabase Auth + profiles table.
// Run with: node scripts/seed.mjs  (needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  console.error("These are pre-populated by the Bolt runtime — run this via `pnpm seed` in the dev environment.");
  process.exit(1);
}

const demoUsers = [
  {
    email: "tenant@staynest.in",
    password: "Password@123",
    fullName: "Rahul Sharma",
    phone: "9876543210",
    role: "Tenant",
  },
  {
    email: "owner@staynest.in",
    password: "Password@123",
    fullName: "Priya Verma",
    phone: "9988776655",
    role: "Property Owner",
  },
];

async function supabaseFetch(path, init = {}) {
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
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { status: res.status, body };
}

async function seed() {
  for (const demo of demoUsers) {
    // Try to sign up via the Auth API (admin create)
    const { status, body } = await supabaseFetch("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: { full_name: demo.fullName, phone: demo.phone, role: demo.role },
      }),
    });

    let userId;
    if (status >= 400) {
      // User may already exist — look them up
      const { body: list } = await supabaseFetch(`/auth/v1/admin/users?per_page=1000`);
      const existing = (list?.users || []).find((u) => u.email === demo.email);
      if (existing) {
        userId = existing.id;
        console.log(`[exists] ${demo.email} (${demo.role})`);
      } else {
        console.error(`[failed] ${demo.email}:`, body?.msg || body?.error || status);
        continue;
      }
    } else {
      userId = body.id;
      console.log(`[created] ${demo.email} (${demo.role})`);
    }

    // Upsert profile
    await supabaseFetch("/rest/v1/profiles", {
      method: "POST",
      body: JSON.stringify({
        id: userId,
        full_name: demo.fullName,
        phone: demo.phone,
        role: demo.role,
      }),
      headers: { Prefer: "return=minimal" },
    });
    // If insert failed due to existing, update instead
    await supabaseFetch(`/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      body: JSON.stringify({
        full_name: demo.fullName,
        phone: demo.phone,
        role: demo.role,
      }),
      headers: { Prefer: "return=minimal" },
    });
    console.log(`[profile] ${demo.email} → ${demo.role}`);
  }
  console.log("\nSeed complete. Demo credentials:");
  console.log("  Tenant: tenant@staynest.in / Password@123");
  console.log("  Owner:  owner@staynest.in / Password@123");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
