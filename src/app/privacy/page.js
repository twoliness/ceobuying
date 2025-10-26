import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - CEO Buying',
  description: 'Privacy policy for CEO Buying - insider trading tracker'
};

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Last updated: {lastUpdated}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              What we collect
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Telegram:</strong> user ID, username, messages you send to the bot (e.g., email for verification).
              </li>
              <li>
                <strong>Billing:</strong> Stripe sends us non-card metadata (email, subscription status, plan, renewal dates). We never see or store full payment details.
              </li>
              <li>
                <strong>Usage:</strong> timestamps for joins/approvals, channel membership, and delivery logs (success/failure).
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              How we use data
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Verify premium access and approve join requests.</li>
              <li>Deliver alerts and premium summaries.</li>
              <li>Prevent abuse, troubleshoot, and improve service.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Retention
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              While your subscription is active and up to 12 months after cancellation for audit/security; then we delete or anonymize.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Sharing
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Processors only: Stripe (payments), hosting (app/db), Telegram (delivery). No selling of personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Your choices
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Access/Update/Erase:</strong> DM /delete in the bot or email{' '}
                <a
                  href="mailto:support@ceobuying.com"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  support@ceobuying.com
                </a>
              </li>
              <li>
                <strong>Opt out of premium:</strong> cancel in Stripe; we'll revoke access automatically or upon expiry.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We use industry-standard controls (encrypted transport, access controls, least privilege).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Children
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Not for users under 18.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Contact
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              <a
                href="mailto:support@ceobuying.com"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                support@ceobuying.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400 text-xs">
            <p className="mb-1">
              Data sourced from SEC EDGAR · ©2025
            </p>
            <Link
              href="/privacy"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
