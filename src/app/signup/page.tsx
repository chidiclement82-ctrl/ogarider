import Link from "next/link";
import { SignupForm } from "@/components/AuthForm";

export const metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "" } = await searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Create your account</h1>
      <div className="card p-6">
        <SignupForm next={next} />
      </div>
      <p className="mt-4 text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-medium text-orange-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
