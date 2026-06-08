
import Categorytabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 min-w-0">
      <Categorytabs />
      <Suspense fallback={<div>Loading videos...</div>}>
        <Videogrid />
      </Suspense>
    </main>
  );
}
