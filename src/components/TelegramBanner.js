export default function TelegramBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-8 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left side - Content */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">
              Daily Snapshot of Insider Activity
            </h3>
            <p className="text-blue-100 text-base sm:text-lg">
              Quick signals on leadership buying, selling, clusters, and sentiment shifts — formatted for busy investors.
            </p>
          </div>

          {/* Right side - CTA */}
          <div className="w-full sm:w-auto">
            <a
              href="https://t.me/CEObuying"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded-lg transition-colors shadow-lg w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
              Join Free Channel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
