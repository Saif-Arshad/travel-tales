"use client";

import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { signIn } from "next-auth/react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const loginSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().required("Required"),
});

const registerSchema = Yup.object().shape({
    name: Yup.string().required("Required"),
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().required("Required").min(6, "Minimum 6 digit"),
});

const forgotPasswordSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Required"),
});

export const setCookie = (cName: string, cValue: any, exDays: number) => {
    const d = new Date();
    d.setTime(d.getTime() + exDays * 24 * 60 * 60 * 1000);
    const expires = "expires=" + d.toUTCString();
    const secure = location.protocol === "https:" ? "Secure;" : "";
    const sameSite = "SameSite=Lax;";
    document.cookie = `${cName}=${cValue};${expires};path=/;${secure}${sameSite}`;
};

export function getCookie(name: string): string | null {
    const cookies = `; ${document.cookie}`;
    const parts = cookies.split(`; ${name}=`);
    if (parts.length === 2 && parts[1]) {
        return parts[1].split(";")[0] ?? null;
    }
    return null;
}

export function deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`;
}

interface AuthModalProps {
    open: boolean;
    onClose: (open: boolean) => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
    const [authMode, setAuthMode] = useState<"login" | "register" | "forgotPassword">("register");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const params = useSearchParams();
    const router = useRouter();
    const errorInParams = params.get("error");

    const loginSubmit = async (values: any, { setSubmitting }: any) => {
        console.log("Logging in...", values);
        await signIn("credentials", { ...values });
        setSubmitting(false);
    };

    const registerSubmit = async (values: any, { setSubmitting }: any) => {
        const payload = {
            name: values.name,
            email: values.email,
            password: values.password,
        }
        try {
            const registerUser = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`,
                payload
            );
            const data = registerUser.data;
            console.log("🚀 ~ registerSubmit ~ data:", registerUser.data)
            await signIn("credentials", {
                email: payload.email,
                password: payload.password,
            });
            console.log("Registered user:", data);
        } catch (error) {
            console.log("Registration error:", error);
        }
        setSubmitting(false);
    };

  

    const Loader = ({ text }: { text: string }) => (
        <div className="flex items-center space-x-2">
            <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
            </svg>
            <span>{text}</span>
        </div>
    );

    useEffect(() => {
        if (errorInParams) {
            router.replace("/");
            toast.error(errorInParams);
        }
    }, [errorInParams, router]);

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 sm:p-8">
                                {authMode === "login" && (
                                    <Transition
                                        appear
                                        show={authMode === "login"}
                                        as={Fragment}
                                        enter="transition ease-out duration-300"
                                        enterFrom="opacity-0 scale-95"
                                        enterTo="opacity-100 scale-100"
                                        leave="transition ease-in duration-200"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-95"
                                    >
                                        <div className="text-start">
                                            <Dialog.Title className="text-2xl font-bold">
                                                Welcome Back
                                            </Dialog.Title>
                                            <Dialog.Description className="text-sm text-gray-600 mb-4">
                                                Login to your account
                                            </Dialog.Description>

                                            <Formik
                                                initialValues={{ email: "", password: "" }}
                                                validationSchema={loginSchema}
                                                onSubmit={loginSubmit}
                                            >
                                                {({ touched, errors, isSubmitting }) => (
                                                    <Form className="space-y-4">
                                                        <div>
                                                            <label
                                                                htmlFor="emailLogin"
                                                                className="block mb-2 ml-1 font-medium text-sm"
                                                            >
                                                                Email
                                                            </label>
                                                            <Field
                                                                type="email"
                                                                name="email"
                                                                id="emailLogin"
                                                                placeholder="jhonDoe@example.com"
                                                                className={`w-full rounded-full px-4 p-2 outline-none border focus:ring-1 transition-colors ${touched.email && errors.email
                                                                    ? "border-red-500 focus:ring-red-500"
                                                                    : "border-primaryColor focus:ring-primaryColor"
                                                                    }`}
                                                            />
                                                            <ErrorMessage
                                                                name="email"
                                                                component="div"
                                                                className="text-red-500 text-xs mt-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label
                                                                htmlFor="passwordLogin"
                                                                className="block mb-2 ml-1 font-medium text-sm"
                                                            >
                                                                Password
                                                            </label>
                                                            <div className="relative">
                                                                <Field
                                                                    type={showLoginPassword ? "text" : "password"}
                                                                    name="password"
                                                                    id="passwordLogin"
                                                                    placeholder="••••••••"
                                                                    className={`w-full rounded-full px-4 p-2 outline-none border focus:ring-1 transition-colors ${touched.password && errors.password
                                                                        ? "border-red-500 focus:ring-red-500"
                                                                        : "border-primaryColor focus:ring-primaryColor"
                                                                        }`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-500 hover:text-gray-700"
                                                                    onClick={() =>
                                                                        setShowLoginPassword(!showLoginPassword)
                                                                    }
                                                                >
                                                                    {showLoginPassword ? <FiEyeOff /> : <FiEye />}
                                                                </button>
                                                            </div>
                                                            <ErrorMessage
                                                                name="password"
                                                                component="div"
                                                                className="text-red-500 text-xs mt-1"
                                                            />

                                                        </div>
                                                        <div>
                                                            <button
                                                                type="submit"
                                                                disabled={isSubmitting}

                                                                className="w-full mt-3  text-white py-2 rounded-full bg-gradient-to-br from-purple-700 to-blue-900 transition-colors flex items-center justify-center"
                                                            >
                                                                {isSubmitting ? (
                                                                    <Loader text="Signing in..." />
                                                                ) : (
                                                                    "Login"
                                                                )}
                                                            </button>
                                                            <div className="text-end mt-2 mr-2 text-sm">
                                                                Don&apos;t have an account?{" "}
                                                                <button
                                                                    type="button"
                                                                    className="text-blue-600 hover:underline"
                                                                    onClick={() => setAuthMode("register")}
                                                                >
                                                                    Sign up
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </Form>
                                                )}
                                            </Formik>

                                        </div>
                                    </Transition>
                                )}

                                {authMode === "register" && (
                                    <Transition
                                        appear
                                        show={authMode === "register"}
                                        as={Fragment}
                                        enter="transition ease-out duration-300"
                                        enterFrom="opacity-0 scale-95"
                                        enterTo="opacity-100 scale-100"
                                        leave="transition ease-in duration-200"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-95"
                                    >
                                        <div className="text-start">
                                            <Dialog.Title className="text-2xl font-bold">
                                                Create an account
                                            </Dialog.Title>
                                            <Dialog.Description className="text-sm text-gray-600 mb-6">
                                                Sign up to get started
                                            </Dialog.Description>

                                            <Formik
                                                initialValues={{ name: "", email: "", password: "", }}
                                                validationSchema={registerSchema}
                                                onSubmit={registerSubmit}
                                            >
                                                {({ touched, errors, isSubmitting }) => (
                                                    <Form className="space-y-4">
                                                        <div className="grid grid-cols-1 md:gap-2 gap-4 md:grid-cols-1">
                                                            <div>
                                                                <label
                                                                    htmlFor="passwordLogin"
                                                                    className="block mb-2 ml-1 font-medium text-sm"
                                                                >
                                                                    Name
                                                                </label>
                                                                <Field
                                                                    type="text"
                                                                    name="name"
                                                                    id="nameRegister"
                                                                    placeholder="Name"
                                                                    className={`w-full rounded-full px-4 p-2 outline-none border focus:ring-1 transition-colors ${touched.name && errors.name
                                                                        ? "border-red-500 focus:ring-red-500"
                                                                        : "border-primaryColor focus:ring-primaryColor"
                                                                        }`}
                                                                />
                                                                <ErrorMessage
                                                                    name="name"
                                                                    component="div"
                                                                    className="text-red-500 text-xs mt-1"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label
                                                                    htmlFor="passwordLogin"
                                                                    className="block mb-2 ml-1 font-medium text-sm"
                                                                >
                                                                    Email
                                                                </label>
                                                                <Field
                                                                    type="email"
                                                                    name="email"
                                                                    id="emailRegister"
                                                                    placeholder="you@example.com"
                                                                    className={`w-full rounded-full px-4 p-2 outline-none border focus:ring-1 transition-colors ${touched.email && errors.email
                                                                        ? "border-red-500 focus:ring-red-500"
                                                                        : "border-primaryColor focus:ring-primaryColor"
                                                                        }`}
                                                                />
                                                                <ErrorMessage
                                                                    name="email"
                                                                    component="div"
                                                                    className="text-red-500 text-xs mt-1"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label
                                                                htmlFor="passwordLogin"
                                                                className="block mb-2 ml-1 font-medium text-sm"
                                                            >
                                                                Email
                                                            </label>
                                                            <div className="relative">
                                                                <Field
                                                                    type={showRegisterPassword ? "text" : "password"}
                                                                    name="password"
                                                                    id="passwordRegister"
                                                                    placeholder="Password"
                                                                    className={`w-full rounded-full px-4 p-2 outline-none border focus:ring-1 transition-colors ${touched.password && errors.password
                                                                        ? "border-red-500 focus:ring-red-500"
                                                                        : "border-primaryColor focus:ring-primaryColor"
                                                                        }`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-500 hover:text-gray-700"
                                                                    onClick={() =>
                                                                        setShowRegisterPassword(!showRegisterPassword)
                                                                    }
                                                                >
                                                                    {showRegisterPassword ? <FiEyeOff /> : <FiEye />}
                                                                </button>
                                                            </div>
                                                            <ErrorMessage
                                                                name="password"
                                                                component="div"
                                                                className="text-red-500 text-xs mt-1"
                                                            />
                                                        </div>

                                                        <div className="w-full pt-5">
                                                            <button
                                                                type="submit"
                                                                disabled={isSubmitting}
                                                                className="w-full mt-3  text-white py-2 rounded-full bg-gradient-to-br from-purple-700 to-blue-900 transition-colors flex items-center justify-center"

                                                            >
                                                                {isSubmitting ? (
                                                                    <Loader text="Registering..." />
                                                                ) : (
                                                                    "Register"
                                                                )}
                                                            </button>
                                                        </div>
                                                    </Form>
                                                )}
                                            </Formik>
                                            <div className="text-end mt-2 mr-2 text-sm">
                                                Already have an account?{" "}
                                                <button
                                                    type="button"
                                                    className="text-blue-600 hover:underline"
                                                    onClick={() => setAuthMode("login")}
                                                >
                                                    Login
                                                </button>
                                            </div>

                                        </div>
                                    </Transition>
                                )}

                               
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}