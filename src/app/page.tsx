import { supabase } from "@/database/dbconnect";
import Dashboard from "./component/Dashboard";

export default async function TestPage() {
  const { data, error } = await supabase.from("reviews").select("*");
  console.log("ERROR:", error);

  return (
    <>
      <Dashboard />
    </>
  );
}
