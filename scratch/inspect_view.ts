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

// Service role client
const supabaseAdmin = createClient(
  env.SUPABASE_URL || process.env.SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Client with anon key
const supabaseAnon = createClient(
  env.SUPABASE_URL || process.env.SUPABASE_URL!,
  env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY!
);

async function run() {
  try {
    // 1. Query as service role
    console.log("Querying public_leaderboard as service role...");
    const { data: adminData, error: adminErr } = await supabaseAdmin
      .from("public_leaderboard" as any)
      .select("*");
    
    if (adminErr) {
      console.error("Admin query error:", adminErr);
    } else {
      console.log("Admin query result:", adminData);
    }

    // 2. Query as Pyarelal Dilip Pawara (user id: 0b07372e-f9c7-4e1b-aac8-2bcf4ac5c239)
    console.log("\nLogging in as Pyarelal Dilip Pawara...");
    // Let's generate a session or just use the service role client with the user's auth context or direct JWT?
    // Actually, we can check privacy_settings first as service role!
    console.log("\nQuerying privacy_settings as service role...");
    const { data: privData, error: privErr } = await supabaseAdmin
      .from("privacy_settings")
      .select("*");
    
    if (privErr) {
      console.error("Privacy settings query error:", privErr);
    } else {
      console.log("Privacy settings in DB:", privData);
    }

  } catch (err) {
    console.error(err);
  }
}

run();
