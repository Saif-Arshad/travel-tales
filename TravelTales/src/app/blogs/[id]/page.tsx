"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useUser } from '@/lib/useUser';
import { Loader2, ThumbsUp, ThumbsDown, Calendar, MapPin, User, UserPlus, UserMinus, Send } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Comment from '@/components/Comment';

interface User {
    id: number;
    name: string;
    profile_picture: string | null;
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
    user_id: number;
    user: User;
    likes_count: number;
    dislikes_count: number;
}

interface AuthUser {
    id: string;
    email?: string;
    name?: string;
    userType?: string;
    token?: string;
    profile_picture?: string | null;
}

interface Comment {
    id: number;
    content: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        profile_picture: string | null;
    };
}

interface CountryInfo {
    country_name: string;
    capital: string;
    languages: string[];
    currencies: Array<{
        code: string;
        name: string;
        symbol: string;
    }>;
    flag_url: string;
}

export default function BlogDetail() {
    const params = useParams();
    const router = useRouter();
    const { user } = useUser() as { user: AuthUser | null };
    const [blog, setBlog] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
    const [loadingCountryInfo, setLoadingCountryInfo] = useState(false);

    useEffect(() => {
        fetchBlogData();
        if (user?.id && blog?.user_id) {
            checkFollowStatus();
            checkUserReaction();
        }
        if (params.id) {
            fetchComments();
            fetchCountryInfo();
        }
    }, [params.id, user?.id, blog?.user_id]);

    const fetchBlogData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs/${params.id}`);
            setBlog(response.data);
        } catch (error) {
            console.error('Error fetching blog:', error);
            toast.error('Failed to load blog post');
        } finally {
            setLoading(false);
        }
    };

    const checkFollowStatus = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/follow-status/${blog?.user_id}?followerId=${user?.id}`
            );
            setIsFollowing(response.data.isFollowing);
        } catch (error: any) {
            console.error('Error checking follow status:', error);
            if (error.response?.status !== 400) {
                toast.error('Failed to check follow status');
            }
        }
    };

    const checkUserReaction = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs/${params.id}/reaction/${user?.id}`
            );
            setUserReaction(response.data.reaction === 'like' ? 'like' : response.data.reaction === 'dislike' ? 'dislike' : null);
        } catch (error) {
            console.error('Error checking user reaction:', error);
        }
    };

    const handleReaction = async (action: 'like' | 'dislike') => {
        if (!user) {
            toast.error('Please login to react to posts');
            return;
        }

        try {
            setIsProcessing(true);
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs/${params.id}/reaction`, {
                user_id: user.id,
                action: userReaction === action ? 'none' : action
            });
            
            setUserReaction(userReaction === action ? null : action);
            
            if (blog) {
                setBlog({
                    ...blog,
                    likes_count: response.data.likes_count,
                    dislikes_count: response.data.dislikes_count
                });
            }
        } catch (error) {
            console.error('Error updating reaction:', error);
            toast.error('Failed to update reaction');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFollow = async () => {
        if (!user) {
            toast.error('Please login to follow users');
            return;
        }

        if (user.id === blog?.user_id.toString()) {
            toast.error('You cannot follow yourself');
            return;
        }

        try {
            setIsProcessing(true);
            if (isFollowing) {
                await axios.delete(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/unfollow/${blog?.user_id}?followerId=${user.id}`
                );
                toast.success('Unfollowed successfully');
            } else {
                await axios.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/follow/${blog?.user_id}?followerId=${user.id}`
                );
                toast.success('Followed successfully');
            }
            setIsFollowing(!isFollowing);
        } catch (error: any) {
            console.error('Error updating follow status:', error);
            toast.error(error.response?.data?.error || 'Failed to update follow status');
        } finally {
            setIsProcessing(false);
        }
    };

    const fetchComments = async () => {
        try {
            setIsLoadingComments(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/comments/blog/${params.id}`);
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
            toast.error('Failed to load comments');
        } finally {
            setIsLoadingComments(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!user) {
            toast.error('Please login to comment');
            return;
        }

        if (!newComment.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }

        try {
            setIsSubmittingComment(true);
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/comments`, {
                blog_id: params.id,
                user_id: user.id,
                content: newComment.trim()
            });
            setComments(prev => [response.data, ...prev]);
            setNewComment('');
            toast.success('Comment added successfully');
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error('Failed to add comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleUpdateComment = async (commentId: number, content: string) => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/comments/${commentId}`, {
                content: content.trim()
            });
            setComments(prev =>
                prev.map(comment =>
                    comment.id === commentId
                        ? { ...comment, content: content.trim() }
                        : comment
                )
            );
            toast.success('Comment updated successfully');
        } catch (error) {
            console.error('Error updating comment:', error);
            throw error;
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/comments/${commentId}`);
            setComments(prev => prev.filter(comment => comment.id !== commentId));
            toast.success('Comment deleted successfully');
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    };

    const fetchCountryInfo = async () => {
        if (!params.id) return;
        
        try {
            setLoadingCountryInfo(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs/${params.id}/country-info`);
            setCountryInfo(response.data);
        } catch (error) {
            console.error('Error fetching country info:', error);
            toast.error('Failed to load country information');
        } finally {
            setLoadingCountryInfo(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold mb-4">Blog not found</h1>
                <Link href="/blogs" className="text-blue-600 hover:underline">
                    Back to blogs
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="relative h-[60vh] w-full">
                <img
                    src={blog.main_image || "/default-blog-cover.jpg"}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
                        <p className="text-lg opacity-90 mb-6">{blog.description}</p>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                <span>{new Date(blog.visit_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                <span>{blog.country_name}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm mb-8">
                    <Link href={`/profile/${blog.user_id}`} className="flex items-center gap-3">
                        <img
                            src={blog.user.profile_picture || "/default-profile.png"}
                            alt={blog.user.name}
                            className="h-12 w-12 rounded-full object-cover"
                        />
                        <div>
                            <h3 className="font-semibold">{blog.user.name}</h3>
                            <p className="text-sm text-gray-500">
                                Posted on {new Date(blog.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </Link>
                    {user?.id !== blog?.user_id.toString() && (
                        <button
                            onClick={handleFollow}
                            disabled={isProcessing}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                                isFollowing
                                    ? 'bg-gray-200 text-gray-800'
                                    : 'bg-blue-600 text-white'
                            } transition-colors`}
                        >
                            {isFollowing ? (
                                <>
                                    <UserMinus className="h-4 w-4" />
                                    Unfollow
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Follow
                                </>
                            )}
                        </button>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                    <h2 className="text-2xl font-bold mb-6">About {blog.country_name}</h2>
                    {loadingCountryInfo ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : countryInfo ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <img
                                    src={countryInfo.flag_url}
                                    alt={`${countryInfo.country_name} flag`}
                                    className="h-8 rounded shadow-sm"
                                />
                                <h3 className="text-xl font-semibold">{countryInfo.country_name}</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <h4 className="font-semibold text-gray-700">Capital</h4>
                                    <p>{countryInfo.capital}</p>
                                </div>
                                
                                <div>
                                    <h4 className="font-semibold text-gray-700">Languages</h4>
                                    <p>{countryInfo.languages.join(', ')}</p>
                                </div>
                                
                                <div className="col-span-2">
                                    <h4 className="font-semibold text-gray-700">Currencies</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {countryInfo.currencies.map((currency) => (
                                            <div
                                                key={currency.code}
                                                className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                                            >
                                                {currency.name} ({currency.symbol})
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">
                            Country information not available
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={() => handleReaction('like')}
                        disabled={isProcessing}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
                            userReaction === 'like'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600'
                        } transition-colors`}
                    >
                        <ThumbsUp className="h-5 w-5" />
                        <span>{blog.likes_count}</span>
                    </button>
                    <button
                        onClick={() => handleReaction('dislike')}
                        disabled={isProcessing}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
                            userReaction === 'dislike'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-600'
                        } transition-colors`}
                    >
                        <ThumbsDown className="h-5 w-5" />
                        <span>{blog.dislikes_count}</span>
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm mt-8">
                    <h2 className="text-2xl font-bold mb-6">Comments</h2>
                    
                    <div className="flex gap-4 mb-8">
                        <img
                            src={user?.profile_picture || "/default-profile.png"}
                            alt={user?.name || "User"}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                disabled={isSubmittingComment}
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={isSubmittingComment}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {isSubmittingComment ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Posting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            <span>Post Comment</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {isLoadingComments ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : comments.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {comments.map(comment => (
                                <Comment
                                    key={comment.id}
                                    {...comment}
                                    currentUserId={user?.id}
                                    onDelete={handleDeleteComment}
                                    onUpdate={handleUpdateComment}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No comments yet. Be the first to comment!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 