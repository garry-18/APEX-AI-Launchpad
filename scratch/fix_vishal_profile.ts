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
    const vishalId = "f6214849-8b5f-4986-9aca-22f550ea207a";
    console.log("Locating 'Gaming' problem statement...");
    const { data: problem } = await supabase
      .from("problem_statements")
      .select("id")
      .eq("name", "Gaming")
      .single();
    
    if (!problem) {
      console.error("Could not find 'Gaming' problem statement in DB!");
      return;
    }

    console.log(`Found 'Gaming' statement with ID: ${problem.id}`);
    
    console.log("Updating Vishal's profile record...");
    const { error } = await supabase
      .from("profiles")
      .update({
        problem_statement: "Gaming",
        problem_statement_id: problem.id
      })
      .eq("id", vishalId);

    if (error) {
      console.error("Update error:", error);
    } else {
      console.log("Vishal's profile updated successfully!");
    }
  } catch (err) {
    console.error(err);
  }
}

run();
