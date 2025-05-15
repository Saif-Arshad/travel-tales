"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dialog } from "@radix-ui/react-dialog";
import { Edit, Loader2, Pencil, Trash2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import uploadToCloudinary from "@/lib/uploadToCloudinary";
import { useUser } from "@/lib/useUser";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

interface BlogPost {
    id: number;
    title: string;
    description: string;
    content: string;
    country_name: string;
    main_image: string;
    visit_date: string;
    created_at: string;
    likes_count: number;
    dislikes_count: number;
}

function Page() {
    const router = useRouter();
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [userBlogs, setUserBlogs] = useState<BlogPost[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState<number | null>(null);
    const [isBlogLoading, setBlogLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    // Fetch user's blog posts
    useEffect(() => {
        const fetchUserBlogs = async () => {
            if (user?.id) {
                try {
                    setBlogLoading(true);
                    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs?user_id=${user.id}`);
                    setUserBlogs(response.data);
                } catch (error) {
                    console.error("Error fetching user blogs:", error);
                    toast.error("Failed to load blog posts");
                } finally {
                    setBlogLoading(false);
                }
            }
        };

        fetchUserBlogs();
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

    const handleDeleteClick = (blogId: number) => {
        setBlogToDelete(blogId);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!blogToDelete) return;

        try {
            setIsDeleting(true);
            await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs/${blogToDelete}`);
            setUserBlogs(prevBlogs => prevBlogs.filter(blog => blog.id !== blogToDelete));
            toast.success("Blog post deleted successfully");
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error("Error deleting blog:", error);
            toast.error("Failed to delete blog post");
        } finally {
            setIsDeleting(false);
            setBlogToDelete(null);
        }
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
              
              <div className="flex flex-col gap-4 mt-10 border-t border-gray-200 pt-10">
                <div className="flex items-center gap-4 justify-between">
                    <p className="text-2xl font-bold text-gray-900">
                        Blog Posts
                    </p>
                    <Link href="/create-post">
                        <button className="py-2.5 px-6 rounded-lg text-sm font-medium bg-indigo-200 text-indigo-600">
                            Create Post
                        </button>
                    </Link>
                </div>

                {isBlogLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                ) : userBlogs.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500">No blog posts yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {userBlogs.map((blog) => (
                            <div key={blog.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="relative h-48">
                                    <img
                                        src={blog.main_image || "/default-blog-cover.jpg"}
                                        alt={blog.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-gray-900 mb-2">{blog.title}</h3>
                                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{blog.description}</p>
                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                        <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                                        <span>{blog.country_name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-500">
                                                {blog.likes_count} likes
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {blog.dislikes_count} dislikes
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => router.push(`/create-post?id=${blog.id}`)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(blog.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <Link href={`/blogs/${blog.id}`}>
                                                <button
                                                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-full"
                                                    title="View"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="p-6">
                        <DialogHeader>
                            <DialogTitle>Delete Blog Post</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-gray-600">Are you sure you want to delete this blog post? This action cannot be undone.</p>
                        </div>
                        <DialogFooter>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                    className="py-2.5 px-6 rounded-lg text-sm font-medium bg-gray-200 text-gray-600"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="py-2.5 px-6 rounded-lg text-sm font-medium bg-red-600 text-white"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </div>
                                    ) : (
                                        "Delete"
                                    )}
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