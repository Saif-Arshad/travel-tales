import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    profile_picture: string | null;
}

interface CommentProps {
    id: number;
    content: string;
    created_at: string;
    user: User;
    currentUserId?: string;
    onDelete: (id: number) => void;
    onUpdate: (id: number, content: string) => void;
}

export default function Comment({
    id,
    content,
    created_at,
    user,
    currentUserId,
    onDelete,
    onUpdate
}: CommentProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);
    const [showActions, setShowActions] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleUpdate = async () => {
        if (editContent.trim() === '') {
            toast.error('Comment cannot be empty');
            return;
        }

        try {
            setIsProcessing(true);
            await onUpdate(id, editContent);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating comment:', error);
            toast.error('Failed to update comment');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsProcessing(true);
            await onDelete(id);
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment');
        } finally {
            setIsProcessing(false);
        }
    };

    const isOwner = currentUserId && user.id.toString() === currentUserId;

    return (
        <div className="flex gap-4 py-4">
            <img
                src={user.profile_picture || "/default-profile.png"}
                alt={user.name}
                className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1">
                <div className="flex items-start justify-between">
                    <div>
                        <h4 className="font-semibold">{user.name}</h4>
                        <p className="text-sm text-gray-500">
                            {new Date(created_at).toLocaleDateString()}
                        </p>
                    </div>
                    {isOwner && (
                        <div className="relative">
                            <button
                                onClick={() => setShowActions(!showActions)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </button>
                            {showActions && (
                                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            setShowActions(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                        disabled={isProcessing}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        disabled={isProcessing}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {isEditing ? (
                    <div className="mt-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            disabled={isProcessing}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="mt-1 text-gray-700">{content}</p>
                )}
            </div>
        </div>
    );
} 