import './globals.css'

export const metadata = {
    title: 'VisionGuard — Violence Detection',
    description: 'Production-grade violence detection dashboard',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}