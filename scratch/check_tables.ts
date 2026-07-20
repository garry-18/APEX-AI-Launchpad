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
    console.log("Fetching list of all tables in the database...");
    
    // We can query the PostgREST API schema by doing a query on pg_catalog or similar.
    // Or we can just call some tables we expect to see if they fail or succeed.
    const tablesToCheck = [
      "profiles",
      "problem_statements",
      "colleges",
      "admin_problem_statements",
      "privacy_settings",
      "ai_analysis",
      "attendance_sessions",
      "attendance_records",
      "attendance_extensions",
      "attendance_holidays",
      "attendance_passwords",
      "attendance_audit_logs",
      "points_audit_logs",
      "notifications",
      "user_notifications",
      "user_roles"
    ];

    const results = [];
    for (const table of tablesToCheck) {
      const { error } = await supabase.from(table).select("count", { count: "exact", head: true });
      if (error) {
        results.push({ table, status: "ERROR", message: error.message });
      } else {
        results.push({ table, status: "EXISTS", message: "OK" });
      }
    }

    console.table(results);
  } catch (err) {
    console.error(err);
  }
}

run();
