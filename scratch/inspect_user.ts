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
    const userId = "0b07372e-f9c7-4e1b-aac8-2bcf4ac5c239";
    console.log(`Inspecting profile for user ${userId}...`);
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, status, onboarding_completed, problem_statement")
      .eq("id", userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error:", error);
      return;
    }

    console.log("Profile details:", profile);
  } catch (err) {
    console.error(err);
  }
}

run();
