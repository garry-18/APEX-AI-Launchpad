import fs from "fs";
import path from "path";

const envContent = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
for (const line of envContent.split("\n")) {
  const clean = line.trim();
  if (clean && !clean.startsWith("#")) {
    const parts = clean.split("=");
    console.log(parts[0]);
  }
}
