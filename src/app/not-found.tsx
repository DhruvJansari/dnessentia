import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[60svh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-4 text-6xl sm:text-7xl">
        This scent has <em>faded.</em>
      </h1>
      <p className="mt-4 max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-dark">
          Back to Home
        </Link>
        <Link href="/attar" className="btn btn-outline">
          Shop Attars
        </Link>
      </div>
    </section>
  );
}
