import Link from 'next/link';

export const metadata = {
  title: 'Unauthorized — Admin Portal',
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-cream-200 p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4" aria-hidden="true">
          <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Access denied</h1>
        <p className="mt-2 text-sm text-cream-600">
          You do not have permission to access the requested admin area. If you believe this is an error, contact the primary Admin.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/admin"
            className="inline-flex justify-center px-5 py-2.5 rounded-xl bg-green-800 text-white text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Back to portal
          </Link>
          <Link
            href="/"
            className="inline-flex justify-center px-5 py-2.5 rounded-xl border border-cream-200 bg-white text-sm font-medium text-gray-700 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Go to store
          </Link>
        </div>
      </div>
    </div>
  );
}
