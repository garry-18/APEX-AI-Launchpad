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
    const { data: problems } = await supabase.from("problem_statements").select("id, name");
    console.log("Problem Statements in DB:");
    console.log(problems);

    const { data: profiles } = await supabase.from("profiles").select("id, full_name, problem_statement");
    console.log("Profiles problem_statement values:");
    console.log(profiles);
  } catch (err) {
    console.error(err);
  }
}

run();
