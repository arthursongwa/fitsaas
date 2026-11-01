import "./globals.css";

export const metadata = { title: "FitSaaS", description: "Suivi du poids, de la nutrition et de l'entraînement" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
