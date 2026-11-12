import supabase from "./config/supabase.js";

async function testSupabase() {
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error("Supabase connection failed:", error.message);
    process.exitCode = 1;
    return;
  }

  console.log("Supabase connected successfully!");
  console.log("Available buckets:", data.map((bucket) => bucket.name));
}

testSupabase();