import { Suspense } from "react";
import RecordsPage from "@/app/_components/records-page";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f7f3] px-4 py-16 text-center text-slate-600">
          正在載入個人帳本…
        </main>
      }
    >
      <RecordsPage />
    </Suspense>
  );
}
