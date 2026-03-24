import type { Metadata } from 'next';
import { Poppins } from 'next/font/google'; 
import '@/styles/globals.css';
import { ThemeProvider } from 'next-themes';

// Load Poppins with all necessary weights for a SaaS UI
const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins', // This creates a CSS variable
});

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
      <body className={`${poppins.variable} font-sans antialiased bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300`}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}