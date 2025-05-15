import { AuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { DefaultUser } from "next-auth";
import axios from 'axios'
declare module "next-auth" {
    interface User extends DefaultUser {
        id?: string;
    }

    interface Session {
        user: {
            id?: string;
            email?: string;
            name?: string;
            userType?: string;
        } & DefaultUser;
    }

    interface JWT {
        id?: string;
        email?: string;
        name?: string;
        userType?: string;
    }
}

const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            type: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const credentialDetails = {
                        email: credentials?.email,
                        password: credentials?.password,
                    };
                    console.log("🚀 ~ authorize ~ credentialDetails:", credentialDetails)
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
                        credentialDetails
                    );
                    const user = response.data;
                    console.log(user);

                    if (user) {
                        return {
                            id: user.user.id,
                            email: user.user.email,
                            name: user.user.name,
                            userType: user.user.role
                        };
                    } else {
                        throw new Error("Invalid Credentials");
                    }
                } catch (error: any) {
                    throw new Error(
                        error.response?.data?.error || "Authorization error"
                    );
                }
            },
        }),
    ],
    pages: {
        signIn: "/",
        error: "/",
    },
    session: {
        maxAge: 14 * 24 * 60 * 60,
        updateAge: 14 * 24 * 60 * 60,
    },
    callbacks: {
        async signIn({ account }) {
            return true;
        },
        async jwt({ token, user, account, trigger, session }) {
            if (trigger === "update" && session) {
                return { ...token, ...session.user };
            }
            if (account && user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                // @ts-ignore
                token.userType = user.userType;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user = {
                    id: token.id as string,
                    email: token.email as string,
                    name: token.name as string,
                    userType: token.userType as string,
                };
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    jwt: {
        maxAge: 14 * 24 * 60 * 60,
    },
};

const getSession = () => getServerSession(authOptions);

export { authOptions, getSession };