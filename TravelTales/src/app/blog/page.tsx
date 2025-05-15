"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useUser } from '@/lib/useUser';
import { 
    Loader2, 
    ThumbsUp, 
    ThumbsDown, 
    Search, 
    Filter, 
    MapPin, 
    Calendar,
    UserPlus,
    UserMinus,
    ChevronLeft,
    ChevronRight,
    User,
    Globe
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

interface AuthUser {
    id: string;
    name?: string;
    profile_picture?: string | null;
}

type SearchType = 'title' | 'country' | 'author';

export default function Blogs() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useUser() as { user: AuthUser | null };
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState<SearchType>('title');
    const [filterBy, setFilterBy] = useState<'latest' | 'most_liked'>('latest');
    const [followingStatus, setFollowingStatus] = useState<Record<number, boolean>>({});
    const [userReactions, setUserReactions] = useState<Record<number, 'like' | 'dislike' | null>>({});
    const [processingAction, setProcessingAction] = useState<Record<number, boolean>>({});

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 9;

    useEffect(() => {
        // Get search parameters from URL
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') as SearchType || 'title';
        const filter = searchParams.get('filter') as 'latest' | 'most_liked' || 'latest';

        setCurrentPage(page);
        setSearchTerm(search);
        setSearchType(type);
        setFilterBy(filter);

        fetchBlogs();
    }, [searchParams]);

    useEffect(() => {
        if (user?.id && blogs.length > 0) {
            checkFollowStatuses();
            checkUserReactions();
        }
    }, [user?.id, blogs]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs`);
            let filteredBlogs = response.data;

            // Apply search filter
            if (searchTerm) {
                filteredBlogs = filteredBlogs.filter((blog: BlogPost) => {
                    const searchLower = searchTerm.toLowerCase();
                    switch (searchType) {
                        case 'country':
                            return blog.country_name.toLowerCase().includes(searchLower);
                        case 'author':
                            return blog.user?.name?.toLowerCase().includes(searchLower);
                        default:
                            return blog.title.toLowerCase().includes(searchLower);
                    }
                });
            }

            // Apply sort
            if (filterBy === 'most_liked') {
                filteredBlogs.sort((a: BlogPost, b: BlogPost) => b.likes_count - a.likes_count);
            } else {
                filteredBlogs.sort((a: BlogPost, b: BlogPost) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            }

            // Calculate pagination
            setTotalPages(Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE));
            
            // Get current page items
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            setBlogs(filteredBlogs.slice(startIndex, endIndex));

        } catch (error) {
            console.error('Error fetching blogs:', error);
            toast.error('Failed to load blogs');
        } finally {
            setLoading(false);
        }
    };

    const updateSearchParams = (updates: Record<string, string>) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        
        // Update or add new parameters
        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                current.set(key, value);
            } else {
                current.delete(key);
            }
        });

        // Update URL without reloading the page
        router.push(`/blog?${current.toString()}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        updateSearchParams({
            search: searchTerm,
            type: searchType,
            page: '1'
        });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateSearchParams({ page: page.toString() });
    };

    const checkFollowStatuses = async () => {
        const statuses: Record<number, boolean> = {};
        for (const blog of blogs) {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/follow-status/${blog.user_id}?followerId=${user?.id}`
                );
                statuses[blog.user_id] = response.data.isFollowing;
            } catch (error) {
                console.error('Error checking follow status:', error);
            }
        }
        setFollowingStatus(statuses);
    };

    const checkUserReactions = async () => {
        const reactions: Record<number, 'like' | 'dislike' | null> = {};
        for (const blog of blogs) {
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

    const handleFollow = async (userId: number) => {
        if (!user) {
            toast.error('Please login to follow users');
            return;
        }

        if (user.id === userId.toString()) {
            toast.error('You cannot follow yourself');
            return;
        }

        try {
            setProcessingAction(prev => ({ ...prev, [userId]: true }));
            if (followingStatus[userId]) {
                await axios.delete(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/unfollow/${userId}?followerId=${user.id}`
                );
                toast.success('Unfollowed successfully');
            } else {
                await axios.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/follow/${userId}?followerId=${user.id}`
                );
                toast.success('Followed successfully');
            }
            setFollowingStatus(prev => ({ ...prev, [userId]: !prev[userId] }));
        } catch (error: any) {
            console.error('Error updating follow status:', error);
            toast.error(error.response?.data?.error || 'Failed to update follow status');
        } finally {
            setProcessingAction(prev => ({ ...prev, [userId]: false }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Search and Filter Section */}
                <form onSubmit={handleSearch} className="mb-8 space-y-4 md:space-y-0 md:flex md:gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search blogs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex gap-4">
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value as SearchType)}
                            className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="title">Search by Title</option>
                            <option value="country">Search by Country</option>
                            <option value="author">Search by Author</option>
                        </select>

                        <select
                            value={filterBy}
                            onChange={(e) => {
                                setFilterBy(e.target.value as 'latest' | 'most_liked');
                                updateSearchParams({ filter: e.target.value });
                            }}
                            className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="latest">Latest</option>
                            <option value="most_liked">Most Liked</option>
                        </select>

                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </form>

                {/* Search Type Indicator */}
                {searchTerm && (
                    <div className="mb-6 flex items-center gap-2 text-gray-600">
                        <span>Searching by:</span>
                        {searchType === 'country' && <Globe className="h-4 w-4" />}
                        {searchType === 'author' && <User className="h-4 w-4" />}
                        {searchType === 'title' && <Search className="h-4 w-4" />}
                        <span className="font-medium capitalize">{searchType}</span>
                        <span>for</span>
                        <span className="font-medium">"{searchTerm}"</span>
                    </div>
                )}

                {/* Blog Grid */}
                {loading ? (
                    <div className="flex justify-center items-center min-h-[400px]">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                ) : blogs.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {blogs.map(blog => (
                                <div key={blog.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    {/* Blog Image */}
                                    <div className="relative h-48">
                                        <img
                                            src={blog.main_image || "/default-blog-cover.jpg"}
                                            alt={blog.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <h3 className="text-white font-bold text-xl line-clamp-2">{blog.title}</h3>
                                        </div>
                                    </div>

                                    {/* Blog Content */}
                                    <div className="p-4">
                                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{blog.description}</p>
                                        
                                        {/* Meta Information */}
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>{new Date(blog.visit_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                <span>{blog.country_name}</span>
                                            </div>
                                        </div>

                                        {/* Author and Actions */}
                                        <div className="flex items-center justify-between">
                                            <Link href={`/profile/${blog.user?.id || blog.user_id}`} className="flex items-center gap-2">
                                                <img
                                                    src={blog.user?.profile_picture || "/default-profile.png"}
                                                    alt={blog.user?.name || "Author"}
                                                    className="h-8 w-8 rounded-full object-cover"
                                                />
                                                <span className="text-sm font-medium">{blog.user?.name || "Unknown Author"}</span>
                                            </Link>
                                            
                                            {user?.id !== (blog.user?.id || blog.user_id).toString() && (
                                                <button
                                                    onClick={() => handleFollow(blog.user?.id || blog.user_id)}
                                                    disabled={processingAction[blog.user?.id || blog.user_id]}
                                                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                                                        followingStatus[blog.user?.id || blog.user_id]
                                                            ? 'bg-gray-100 text-gray-600'
                                                            : 'bg-blue-50 text-blue-600'
                                                    }`}
                                                >
                                                    {followingStatus[blog.user?.id || blog.user_id] ? (
                                                        <>
                                                            <UserMinus className="h-3 w-3" />
                                                            <span>Unfollow</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserPlus className="h-3 w-3" />
                                                            <span>Follow</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
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
                                            <Link href={`/blogs/${blog.id}`}>
                                                <button className="text-blue-600 text-sm font-medium hover:underline">
                                                    Read More
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-8 flex justify-center items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`w-10 h-10 rounded-lg ${
                                        currentPage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No blogs found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
}