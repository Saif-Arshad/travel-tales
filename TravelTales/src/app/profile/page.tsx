"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dialog } from "@radix-ui/react-dialog";
import { Edit, Loader2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import uploadToCloudinary from "@/lib/uploadToCloudinary";
import { useUser } from "@/lib/useUser";

interface UserProfile {
    id: string;
    name: string;
    profile_picture: string;
    banner_picture: string;
    email: string;
    followerCount: number;
    followingCount: number;
    createdAt: string;
    userType: string;
}

function Page() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [profileData, setProfileData] = useState<UserProfile | null>(null);

    interface EditProfileData {
        profileImage: any;
        bannerImage: any;
        profileImagePreview: string;
        bannerImagePreview: string;
        name: string;
    }

    const [editProfileData, setEditProfileData] = useState<EditProfileData>({
        profileImage: '',
        bannerImage: '',
        profileImagePreview: '',
        bannerImagePreview: "",
        name: ""
    });
    console.log(editProfileData);
    useEffect(() => {
        const fetchProfileData = async () => {
            if (user?.id) {
                try {
                    setLoading(true);
                    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user.id}`);
                    console.log(response.data);
                    setProfileData(response.data);
                    const profileImage = response.data.profile_picture || "/default-profile.png";
                    const bannerImage = response.data.banner_picture || "/default-banner.jpg";
                    setEditProfileData(prev => ({
                        ...prev,
                        profileImage: profileImage,
                        bannerImage: bannerImage,
                        name: response.data.name
                    }));
                } catch (error) {
                    console.error("Error fetching profile data:", error);
                    toast.error("Failed to load profile data");
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchProfileData();
    }, [user?.id]);

    const onClose = () => {
        setIsOpen(false);
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            let profileImageUrl = editProfileData.profileImage;
            let bannerImageUrl = editProfileData.bannerImage;

            if (editProfileData.profileImage instanceof File) {
                const { URL, error } = await uploadToCloudinary(editProfileData.profileImage);
                if (error) {
                    toast.error("Failed to upload profile image");
                    return;
                }
                profileImageUrl = URL;
            }

            if (editProfileData.bannerImage instanceof File) {
                const { URL, error } = await uploadToCloudinary(editProfileData.bannerImage);
                if (error) {
                    toast.error("Failed to upload banner image");
                    return;
                }
                bannerImageUrl = URL;
            }

            await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user?.id}`, {
                profile_picture: profileImageUrl,
                banner_picture: bannerImageUrl,
                name: editProfileData.name
            });

            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user?.id}`);

            setProfileData(response.data);
            
            toast.success("Profile updated successfully!");
            onClose();
        } catch (error) {
            console.error("Error updating profile", error);
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: any, fieldName: string) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file); // Create a URL for the image preview
            setEditProfileData((prev) => ({
                ...prev,
                [fieldName]: file, // Store the file object itself for upload
                [`${fieldName}Preview`]: previewUrl, // Store the preview URL for displaying in the modal
            }));
        }
    };

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setEditProfileData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    if(loading){
        return <div className="flex justify-center min-h-screen items-center h-screen">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
    }
    return (
        <section className="relative pb-24">
            <div className="relative z-0 group">
                <img
                    src={profileData?.banner_picture || "/default-banner.jpg"}
                    alt="cover-image"
                    className="w-full absolute top-0 left-0 z-0 h-60 object-cover"
                />
                <label onClick={() => setIsOpen(true)} htmlFor="bannerImageInput" className="absolute top-3 flex items-center gap-1 px-2 text-sm right-3 cursor-pointer  bg-white p-2 rounded-full">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                </label>
            </div>

            <div className="w-full max-w-7xl z-10 pt-40 mx-auto px-6 md:px-8">
                <div className="flex items-center justify-center sm:justify-start relative z-10 mb-5">
                    <img
                        src={profileData?.profile_picture || "/default-profile.png"}
                        alt="user-avatar-image"
                        className="border-4 border-solid border-white rounded-full h-36 w-36 object-cover"
                    />
                </div>
                <div className="flex flex-col sm:flex-row max-sm:gap-5 items-center justify-between mb-5">
                    <div className="block">
                        <h3 className="font-manrope font-bold text-4xl text-gray-900 capitalize">
                            {profileData?.name}
                        </h3>
                        <div>
                            <p className="font-normal text-sm leading-7 text-gray-500">
                                {profileData?.createdAt &&
                                    `Joined ${new Date(profileData.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                    

                        <div className="flex gap-6">
                           
                                <div className="flex flex-col items-center px-6 border-r border-gray-200">
                                    <span className="text-2xl font-bold text-gray-900">
                                        {profileData?.followerCount || 0}
                                    </span>
                                    <span className="text-sm text-gray-600 font-medium">
                                        Followers
                                    </span>
                                </div>

                            <div className="flex flex-col items-center px-6">
                                <span className="text-2xl font-bold text-gray-900">
                                    {profileData?.followingCount || 0}
                                </span>
                                <span className="text-sm text-gray-600 font-medium">
                                    Following
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
              

                <Dialog open={isOpen} onOpenChange={onClose}>
                    <DialogContent className="p-6">
                        <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>
                        <div className="relative mb-7">
                            <label htmlFor="modalBannerImageInput" className="cursor-pointer w-full">
                                <Pencil className="p-1 rounded-full bg-white absolute bottom-2 right-2" />
                                <img
                                    src={editProfileData.bannerImagePreview || editProfileData.bannerImage || "/default-banner.jpg"}
                                    alt="Banner"
                                    className="h-[20vh] w-full rounded-lg"
                                />
                                <input
                                    type="file"
                                    id="modalBannerImageInput"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleImageChange(e, 'bannerImage')}
                                />
                            </label>
                            <label htmlFor="modalProfileImageInput" className="h-16 w-16 rounded-full left-3 -bottom-5 absolute cursor-pointer">
                                <Pencil className="p-1 rounded-full bg-white absolute h-5 w-5 -right-1" />
                                <img
                                    src={editProfileData.profileImagePreview || editProfileData.profileImage || "/default-profile.png"}
                                    alt="Profile"
                                    className="rounded-full h-full w-full object-cover"
                                />
                                <input
                                    type="file"
                                    id="modalProfileImageInput"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleImageChange(e, 'profileImage')}
                                />
                            </label>
                        </div>
                            <Label htmlFor="email" className="mt-2">Name</Label>
                            <input
                                id="name"
                                type="name"
                                name="name"
                                value={editProfileData.name}
                                onChange={handleInputChange}
                                className="mb-5 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"

                            />


                        <DialogFooter>
                            <div className="flex gap-3 max-w-sm">
                                <button
                                    onClick={onClose}
                                    className="py-2.5 px-6 rounded-lg text-sm font-medium bg-indigo-200 text-indigo-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    className="py-2.5 px-6 rounded-lg text-sm font-medium text-white bg-indigo-600"
                                >
                                    {loading ? "Updating..." : "Update"}
                                </button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
}

export default Page;