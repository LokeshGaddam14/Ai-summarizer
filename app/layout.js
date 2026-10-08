import "./globals.css";

export const metadata = {
  title: "AI Web Page Summarizer",
  description: "Paste a URL and get an AI-generated summary.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
