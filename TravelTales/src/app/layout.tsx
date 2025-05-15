import type { Metadata } from "next";
import "./globals.css";
import { AOSProvider } from "@/components/aos";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Header from "@/components/shared/header/Header";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "TravelTales   ",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" suppressHydrationWarning >
      <body >
        <AOSProvider session={session} >
        <Toaster position="top-right" />
          <Header />
          {children}
          <footer className="bg-gray-100">
  <div className="max-w-screen-xl px-4 pt-8 pb-5 mx-auto sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <Image
        src={"/logo.png"}
        alt="logo"
        height={120}
        width={120}
        className="mr-5" 
        />
        <p className="max-w-xs mt-4 text-sm text-gray-600">
        Explore the world through the eyes of fellow travelers and contribute your own journey today.
        </p>
        
      </div>
      <div className="grid grid-cols-2 gap-8 ">
        <div>
          <p className="font-medium">
            Quick Links
          </p>
          <nav className="flex flex-col mt-4 space-y-2 text-sm text-gray-500">
            <Link href={"/"} className="hover:opacity-75" > Home </Link>
            <Link href={"/blog"} className="hover:opacity-75" > Latest Blogs </Link>
          </nav>
        </div>
   
      
        <div>
          <p className="font-medium">
            Contact Information
          </p>
          <nav className="flex flex-col mt-4 space-y-2 text-sm text-gray-500">
            <p className="hover:opacity-75" >+5034957340</p>
            <p className="hover:opacity-75" >traveltales@gmail.com </p>
          </nav>
        </div>
      </div>
    </div>
    <p className="mt-8 text-xs text-center border-t border-gray-200 pt-4 text-gray-800">
      © 2024 Travel Thrills
    </p>
  </div>
</footer>

        </AOSProvider>
      </body>
    </html>
  );
}
