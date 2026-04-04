import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import localFont from "next/font/local";

const generalSans = localFont({
  src: [
    {
      path: "../../public/fonts/general-sans/GeneralSans-Regular.woff2",
      weight: "400",
    },
    {
      path: "../../public/fonts/general-sans/GeneralSans-Medium.woff2",
      weight: "500",
    },
    {
      path: "../../public/fonts/general-sans/GeneralSans-Bold.woff2",
      weight: "700",
    },
  ],
  variable: "--font-general-sans",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/login");
  }

  return (
    <html lang="en">
      <body className={`${generalSans.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
