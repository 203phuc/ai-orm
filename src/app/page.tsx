import { Suspense } from "react";
import Dashboard from "./component/Dashboard";

export default async function TestPage() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </Suspense>
    </>
  );
}
