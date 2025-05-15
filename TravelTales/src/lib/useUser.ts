"use client";
import { signOut, useSession } from "next-auth/react";


export const useUser = () => {
    const session = useSession();
    const user = session.data?.user
    const logoutUser = async () => {
        await signOut()
        window.location.href = "/"
    }

    return { user, logoutUser };
}