import { ThemeProvider } from '@/components/theme-provider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex min-h-full flex-col items-center justify-center bg-[var(--surface)] px-4 py-12">
        <div className="mb-8 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </span>
          <span className="text-base font-semibold text-[var(--text)]">Vantage</span>
        </div>
        {children}
      </div>
    </ThemeProvider>
  );
}
