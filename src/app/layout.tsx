import type { Metadata } from "next";
import "./globals.css";
import 'leaflet/dist/leaflet.css'
import { AuthProvider } from '@/contexts/AuthContext';
import AuthSidebar from '@/components/AuthSidebar';4



export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="rtl">
      <body>
        <AuthProvider>
          <AuthSidebar />
          <div className="pr-80"> {/* Add padding for sidebar */}
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
