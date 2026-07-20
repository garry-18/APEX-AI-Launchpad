import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Simple env loader
const envContent = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.trim().match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
}

const supabase = createClient(
  env.SUPABASE_URL || process.env.SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  try {
    // 1. Query auth.users via SQL/RPC or check if there is an admin api
    console.log("Fetching auth users list...");
    // Supabase JS client has auth.admin.listUsers() which uses service role!
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error("Error listing auth users:", error);
      return;
    }

    console.log(`Total auth users: ${users.length}`);
    const authList = users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at
    }));

    // 2. Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, role");

    const profileIds = new Set((profiles || []).map(p => p.id));

    const comparativeList = authList.map(au => ({
      ...au,
      has_profile: profileIds.has(au.id),
      profile_name: (profiles || []).find(p => p.id === au.id)?.full_name || "N/A",
      role: (profiles || []).find(p => p.id === au.id)?.role || "N/A"
    }));

    console.table(comparativeList);

  } catch (err) {
    console.error(err);
  }
}

run();
