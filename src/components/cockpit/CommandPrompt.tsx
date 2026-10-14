import { memo, useState } from 'react';

interface CommandPromptProps {
  onOpenSettings?: () => void;
  onOpenPalette?: () => void;
}

export const CommandPrompt = memo(function CommandPrompt({
  onOpenSettings,
  onOpenPalette,
}: CommandPromptProps) {
  const [input, setInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query) return;

    // Check for special internal commands
    if (query === 'settings' || query === ':settings' || query === '/settings') {
      onOpenSettings?.();
      setInput('');
      return;
    }
    if (query === 'palette' || query === ':palette' || query === '/palette' || query === '?') {
      onOpenPalette?.();
      setInput('');
      return;
    }
    if (query === 'admin' || query === 'sudo') {
      setIsAdmin((prev) => !prev);
      setInput('');
      return;
    }

    // Check if URL
    const isUrl =
      /^(https?:\/\/)/i.test(query) ||
      (/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(query) && !query.includes(' '));

    if (isUrl) {
      const url = /^https?:\/\//i.test(query) ? query : `https://${query}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      setInput('');
      return;
    }

    // Default: execute via default search or terminal echo
    setStatusMessage(isAdmin ? `[ADMIN]: Executed "${query}"` : `Command: "${query}"`);
    setTimeout(() => setStatusMessage(null), 3000);

    // If query looks like a search, open Google
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
    setInput('');
  };

  return (
    <div className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className={`group flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all backdrop-blur-md ${
          isAdmin
            ? 'border-amber-500/40 bg-amber-500/[0.07] shadow-[0_0_15px_rgba(245,158,11,0.15)]'
            : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
        }`}
      >
        {/* Terminal prompt symbol */}
        <span
          className={`font-mono text-xs font-bold select-none ${
            isAdmin ? 'text-amber-400' : 'text-cyan-400'
          }`}
        >
          $
        </span>

        {/* Command Input Field */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isAdmin ? 'ADMIN: Type command or URL...' : 'Type command or URL...'}
          className="w-full min-w-0 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none font-mono"
        />

        {/* Elevated Administrator Toggle Button */}
        <button
          type="button"
          onClick={() => setIsAdmin((prev) => !prev)}
          title={
            isAdmin
              ? 'Elevated Administrator mode active (Click to disable)'
              : 'Toggle Administrator privileges'
          }
          aria-label="Administrator mode"
          className={`flex size-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
            isAdmin
              ? 'border-amber-400/60 bg-amber-400/20 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'border-white/10 bg-white/5 text-white/40 hover:border-white/25 hover:text-white/80'
          }`}
        >
          {/* Shield / Admin terminal icon */}
          <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </form>

      {/* Floating Status / Echo feedback */}
      {statusMessage && (
        <div className="absolute left-0 -top-7 z-20 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-mono text-amber-300 backdrop-blur-md border border-amber-500/30">
          <span>⚡</span>
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
});
