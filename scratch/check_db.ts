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
    console.log("Checking user_roles...");
    const { data: roles, error: rErr } = await supabase
      .from("user_roles")
      .select("*");
    
    if (rErr) console.error("Roles error:", rErr);
    else console.log("Roles in DB:", roles);

    console.log("Testing join query via service role (bypassing RLS)...");
    const { data: joinData, error: joinErr } = await supabase
      .from("admin_problem_statements" as any)
      .select("admin_id, problem_statement_id, is_active, problem_statements(id, name)");
    
    if (joinErr) console.error("Join error:", joinErr);
    else {
      console.log("Join result (service role):");
      console.dir(joinData, { depth: null });
    }
  } catch (err) {
    console.error("Catastrophic error:", err);
  }
}

run();
