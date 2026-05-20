const Footer = () => {
  return (
    <footer className="mt-16 border-t border-surface-200 bg-white/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-surface-500">
          <div className="flex items-center gap-2 text-center md:text-left">
            <span className="font-semibold text-surface-700">StockLens</span>
            <span className="hidden md:inline">·</span>
            <span>
              An implementation of the Real-Time Visibility &amp;
              Expiry-Tracking (RVET) model
            </span>
          </div>
          <div className="text-center md:text-right">
            <span>
              Victoria O. Godwin · Computer &amp; Information Sciences,
              Covenant University · 2025
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;