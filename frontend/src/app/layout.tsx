import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'ReminderFlow',
  description: 'Multi-tenant SaaS platform for scheduling reminder emails',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
        />
      </head>
      {/* 
        The background colors and text colors are now automatically handled 
        by the body {} block in your updated globals.css!
      */}
      <body className="font-sans antialiased transition-colors duration-500">
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem
          disableTransitionOnChange
        >
          {children}
          
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid rgba(148, 163, 184, 0.2)', // Soft slate border
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '16px', // Matched to your new SaaS cards
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                fontFamily: 'Poppins, ui-sans-serif, system-ui, sans-serif',
              },
              success: {
                iconTheme: {
                  primary: '#10b981', // Emerald 500
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444', // Red 500
                  secondary: '#ffffff',
                },
              },
              className: 'dark:!bg-slate-900 dark:!text-slate-100 dark:!border-slate-800',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}