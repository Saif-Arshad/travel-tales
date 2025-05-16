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

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 9;

    useEffect(() => {
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

            if (filterBy === 'most_liked') {
                filteredBlogs.sort((a: BlogPost, b: BlogPost) => b.likes_count - a.likes_count);
            } else {
                filteredBlogs.sort((a: BlogPost, b: BlogPost) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            }

            setTotalPages(Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE));
            
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
        
        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                current.set(key, value);
            } else {
                current.delete(key);
            }
        });

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
                <div className="bg-white rounded-2xl shadow-sm p-8 mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Discover Amazing Travel Stories</h1>
                    <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Search blogs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                />
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value as SearchType)}
                                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
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
                                    className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                >
                                    <option value="latest">Latest</option>
                                    <option value="most_liked">Most Liked</option>
                                </select>

                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {searchTerm && (
                    <div className="mb-8 flex items-center gap-2 text-gray-600 bg-white p-4 rounded-xl shadow-sm">
                        <span>Searching by:</span>
                        {searchType === 'country' && <Globe className="h-4 w-4" />}
                        {searchType === 'author' && <User className="h-4 w-4" />}
                        {searchType === 'title' && <Search className="h-4 w-4" />}
                        <span className="font-medium capitalize">{searchType}</span>
                        <span>for</span>
                        <span className="font-medium">"{searchTerm}"</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center min-h-[400px]">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                ) : blogs.length > 0 ? (
                    <>
                        <div className="space-y-6">
                            {blogs.map(blog => (
                                <div key={blog.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="md:w-96 h-64 md:h-auto relative">
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
                                                        <img
                                                            src={blog.user?.profile_picture || "/default-profile.png"}
                                                            alt={blog.user?.name || "Author"}
                                                            className="h-10 w-10 rounded-full object-cover"
                                                        />
                                                        <div>
                                                            <span className="font-medium text-gray-900">{blog.user?.name || "Unknown Author"}</span>
                                                            {user?.id !== (blog.user?.id || blog.user_id).toString() && (
                                                                <button
                                                                    onClick={() => handleFollow(blog.user?.id || blog.user_id)}
                                                                    disabled={processingAction[blog.user?.id || blog.user_id]}
                                                                    className={`block mt-1 text-sm ${
                                                                        followingStatus[blog.user?.id || blog.user_id]
                                                                            ? 'text-gray-600'
                                                                            : 'text-blue-600'
                                                                    }`}
                                                                >
                                                                    {followingStatus[blog.user?.id || blog.user_id] ? 'Following' : 'Follow'}
                                                                </button>
                                                            )}
                                                        </div>

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

                        <div className="mt-8 flex justify-center items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
                                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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