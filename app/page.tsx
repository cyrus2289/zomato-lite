// Homepage. Two quiet doors, nothing more.
// This is deliberately NOT a listing page — the only restaurant
// we care about is reachable directly.

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] text-[#1a1a1a]">
      <div className="text-center">
        <p className="text-lg">zomato-lite is alive</p>
        <div className="mt-4 space-x-6 text-sm">
          <Link href="/restaurant/1" className="text-[#b45309] hover:underline">
            Ludhiana Burrito →
          </Link>
          <Link href="/review/1" className="hover:underline">
            Write a review →
          </Link>
        </div>
      </div>
    </main>
  );
}
