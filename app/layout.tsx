import "../src/index.css";

export const metadata = {
  title: "Hunfly",
  description: "Hunfly — plataforma de vendas com IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}