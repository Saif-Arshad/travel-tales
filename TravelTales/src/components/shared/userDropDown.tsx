"use client";

import { Fragment, useEffect } from "react";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";

export function UserDropDown() {
    const router = useRouter();
    const { user, logoutUser } = useUser();
    console.log("🚀 ~ UserDropDown ~ user:", user)

 
    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="relative h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-700 to-blue-900  text-white focus:outline-none">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "G"}
                </Menu.Button>
            </div>

            <Transition
                as={Fragment}

                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute z-[100] right-0 mt-2 w-56 origin-top-right rounded-xl border border-primaryBlue bg-white shadow-lg focus:outline-none">
                    <div className="px-3 py-2">
                        <div className="flex flex-col space-y-1">
                            <p className="font-medium capitalize">{user?.name || "Guest"}</p>
                            <p className="text-xs text-muted-foreground">
                                {user?.email || "Not logged in"}
                            </p>
                        </div>
                    </div>
                    <div className="border-t border-gray-200" />

                    <div className="py-1">
                                <>
                                  
                                    <Menu.Item>
                                        {({ active }) => (
                                            <Link href="/profile">
                                                <button
                                                    className={`${active ? "bg-gray-100" : ""
                                                        } flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700`}
                                                >
                                                    My Profile
                                                    <span className="text-xs">⇧⌘P</span>
                                                </button>
                                            </Link>
                                        )}
                                    </Menu.Item>
                                 
                                </>
                            

                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={logoutUser}
                                    className={`${active ? "bg-gray-100" : ""
                                        } flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700`}
                                >
                                    Log out
                                    <span className="text-xs">⇧⌘Q</span>
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}