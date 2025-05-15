"use client";

import { useEffect, ReactNode } from "react";
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
export const AOSProvider = ({ children, session }: { children: ReactNode, session: any }) => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            once: false,
        });
    }, []);

    return <>
        <Toaster />
        < SessionProvider session = { session } >
            { children }
            </SessionProvider>
            </>;
};