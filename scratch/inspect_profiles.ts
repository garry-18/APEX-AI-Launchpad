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
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, problem_statement");
    
    if (error) {
      console.error("Error fetching profiles:", error);
      return;
    }

    console.log("Profiles list in database:");
    console.table(profiles);
  } catch (err) {
    console.error(err);
  }
}

run();
