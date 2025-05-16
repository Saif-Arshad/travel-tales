"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useUser } from '@/lib/useUser';
import { 
    Loader2, 
    ThumbsUp, 
    ThumbsDown,
    Calendar,
    MapPin,
    UserMinus,
    User
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface BlogPost {
    id: number;
    title: string;
    description: string;
    country_name: string;
    main_image: string;
    visit_date: string;
    created_at: string;
    user_id: number;
    user?: {
        id: number;
        name: string;
        profile_picture: string | null;
    };
    likes_count: number;
    dislikes_count: number;
}

export default function Feed() {
    const router = useRouter();
    const { user } = useUser();
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [userReactions, setUserReactions] = useState<Record<number, 'like' | 'dislike' | null>>({});
    const [processingAction, setProcessingAction] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (user?.id) {
            fetchFeedBlogs();
        }
    }, [user?.id]);

    const fetchFeedBlogs = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs/feed/${user?.id}`);
            setBlogs(response.data);
            checkUserReactions(response.data);
        } catch (error) {
            console.error('Error fetching feed:', error);
            toast.error('Failed to load feed');
        } finally {
            setLoading(false);
        }
    };

    const checkUserReactions = async (blogPosts: BlogPost[]) => {
        const reactions: Record<number, 'like' | 'dislike' | null> = {};
        for (const blog of blogPosts) {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs/${blog.id}/reaction/${user?.id}`
                );
                reactions[blog.id] = response.data.reaction === 'like' 
                    ? 'like' 
                    : response.data.reaction === 'dislike' 
                        ? 'dislike' 
                        : null;
            } catch (error) {
                console.error('Error checking user reaction:', error);
            }
        }
        setUserReactions(reactions);
    };

    const handleReaction = async (blogId: number, action: 'like' | 'dislike') => {
        if (!user) {
            toast.error('Please login to react to posts');
            return;
        }

        try {
            setProcessingAction(prev => ({ ...prev, [blogId]: true }));
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs/${blogId}/reaction`,
                {
                    user_id: user.id,
                    action: userReactions[blogId] === action ? 'none' : action
                }
            );
            
            setUserReactions(prev => ({
                ...prev,
                [blogId]: prev[blogId] === action ? null : action
            }));
            
            setBlogs(prev => prev.map(blog => 
                blog.id === blogId 
                    ? { 
                        ...blog, 
                        likes_count: response.data.likes_count,
                        dislikes_count: response.data.dislikes_count
                    } 
                    : blog
            ));
        } catch (error) {
            console.error('Error updating reaction:', error);
            toast.error('Failed to update reaction');
        } finally {
            setProcessingAction(prev => ({ ...prev, [blogId]: false }));
        }
    };

    const handleUnfollow = async (userId: number) => {
        try {
            setProcessingAction(prev => ({ ...prev, [userId]: true }));
            await axios.delete(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/unfollow/${userId}?followerId=${user?.id}`
            );
            toast.success('Unfollowed successfully');
            // Remove blogs from unfollowed user
            setBlogs(prev => prev.filter(blog => blog.user_id !== userId));
        } catch (error: any) {
            console.error('Error unfollowing user:', error);
            toast.error(error.response?.data?.error || 'Failed to unfollow user');
        } finally {
            setProcessingAction(prev => ({ ...prev, [userId]: false }));
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold mb-4">Please login to view your feed</h1>
                <Link href="/login" className="text-blue-600 hover:underline">
                    Login
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Feed</h1>

                {blogs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your feed is empty</h2>
                        <p className="text-gray-500 mb-6">Follow some users to see their posts here</p>
                        <Link 
                            href="/blog" 
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Discover Users
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {blogs.map(blog => (
                            <div key={blog.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                    <div className="md:w-72 h-48 md:h-auto relative">
                                        <img
                                            src={blog.main_image || "/default-blog-cover.jpg"}
                                            alt={blog.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="flex-1 p-6">
                                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>{new Date(blog.visit_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                <span>{blog.country_name}</span>
                                            </div>
                                        </div>

                                        <h2 className="text-2xl font-bold text-gray-900 mb-3">{blog.title}</h2>
                                        
                                        <p className="text-gray-600 mb-6 line-clamp-2">{blog.description}</p>

                                        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                                            <div className="flex items-center gap-6">
                                                {/* Author */}
                                                <Link href={`/profile/${blog.user?.id}`} className="flex items-center gap-3">
                                                    <img
                                                        src={blog.user?.profile_picture || "/default-profile.png"}
                                                        alt={blog.user?.name || "Author"}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                    <div>
                                                        <span className="font-medium text-gray-900">{blog.user?.name}</span>
                                                        <button
                                                            onClick={() => handleUnfollow(blog.user?.id || blog.user_id)}
                                                            disabled={processingAction[blog.user?.id || blog.user_id]}
                                                            className="block mt-1 text-sm text-gray-500 hover:text-red-600"
                                                        >
                                                            Unfollow
                                                        </button>
                                                    </div>
                                                </Link>

                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleReaction(blog.id, 'like')}
                                                        disabled={processingAction[blog.id]}
                                                        className={`flex items-center gap-1 ${
                                                            userReactions[blog.id] === 'like'
                                                                ? 'text-blue-600'
                                                                : 'text-gray-500'
                                                        }`}
                                                    >
                                                        <ThumbsUp className="h-4 w-4" />
                                                        <span>{blog.likes_count}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleReaction(blog.id, 'dislike')}
                                                        disabled={processingAction[blog.id]}
                                                        className={`flex items-center gap-1 ${
                                                            userReactions[blog.id] === 'dislike'
                                                                ? 'text-red-600'
                                                                : 'text-gray-500'
                                                        }`}
                                                    >
                                                        <ThumbsDown className="h-4 w-4" />
                                                        <span>{blog.dislikes_count}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <Link href={`/blogs/${blog.id}`}>
                                                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                                    Read More
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
        </div>
    );
} 