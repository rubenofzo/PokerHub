import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState>
      That card isn&rsquo;t in the deck.{" "}
      <Link href="/" className="font-bold text-brass underline">
        Back to the dashboard
      </Link>
    </EmptyState>
  );
}
