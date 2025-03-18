import "@/app/globals.css"

export const metadata = {
  title: 'Word File Processor',
  description: 'Process and fix Word documents automatically',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  )
}
