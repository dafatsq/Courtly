import './globals.css'
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const poppins = Poppins({ 
  weight: ['600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins'
})

export const metadata: Metadata = {
  title: 'Book My Court',
  description: 'Simple Badminton Reservation App',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} ${poppins.variable}`}>
      <body className="min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <header className="mb-8">
            <a href="/" className="inline-block">
              <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 font-poppins hover:from-blue-700 hover:to-cyan-600 transition-all">
                BookMyCourt
              </h1>
            </a>
            <p className="text-gray-600 mt-1">Reserve badminton courts with ease.</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
