"use client"

import React, { useState, useEffect } from 'react'
import RichTextEditor from '@/components/text-editor'
import Image from 'next/image';
import countries from '@/components/countries.json';
import { FiUpload, FiCalendar, FiMap } from 'react-icons/fi';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import uploadToCloudinary from '@/lib/uploadToCloudinary';
import { useUser } from '@/lib/useUser';

function CreatePost() {
  const [value, setValue] = useState('');
  const [imagePreview, setImagePreview] = useState('/default-banner.jpg');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    country_name: '',
    visit_date: '',
    main_image: '',
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const {user} = useUser()
  const blogId = searchParams.get('id');
  const isEditing = !!blogId;

  useEffect(() => {
    if (blogId) {
      fetchBlogData();
    }
  }, [blogId]);

  const fetchBlogData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs/${blogId}`);
      const blog = response.data;
      setFormData({
        title: blog.title,
        description: blog.description,
        country_name: blog.country_name,
        visit_date: blog.visit_date,
        main_image: blog.main_image,
      });
      setValue(blog.content);
      if (blog.main_image) {
        setImagePreview(blog.main_image);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch blog data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const result = await uploadToCloudinary(file);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setImagePreview(result.URL);
      setFormData(prev => ({ ...prev, main_image: result.URL }));
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUpload(file);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!user) {
        toast.error('Please login to create a post');
        return;
      }

      setIsLoading(true);
      const payload = {
        ...formData,
        content: value,
        user_id: user.id,
      };

      if (isEditing) {
        await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs/${blogId}`, payload);
        toast.success('Blog updated successfully');
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs`, payload);
        toast.success('Blog created successfully');
      }

      router.push('/profile'); 
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save blog');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 sm:p-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {isEditing ? 'Edit Your Travel Story' : 'Create Your Travel Story'}
          </h1>
          
          {/* Image Upload Section */}
          <div 
            className={`relative h-80 w-full rounded-2xl overflow-hidden mb-8 group transition-all duration-300 ${
              isDragging ? 'border-4 border-blue-500 border-dashed' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Image 
              src={imagePreview} 
              alt="create-post" 
              fill 
              className='object-cover transition-transform duration-300 group-hover:scale-105' 
            />
            <div className='absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 group-hover:bg-opacity-50 flex items-center justify-center'>
              <label className='cursor-pointer'>
                <div className='bg-white text-gray-800 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 hover:bg-gray-50 transition-colors duration-200'>
                  {isUploading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <FiUpload className="w-5 h-5" />
                      <span>Upload Cover Image</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }} 
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Title Input */}
          <input 
            type="text" 
            placeholder='Give your story a title...' 
            className='w-full p-4 text-xl font-medium rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mb-6'
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />

          {/* Description Textarea */}
          <textarea    
            cols={4} 
            rows={4} 
            placeholder='Write a brief description of your journey...' 
            className='w-full p-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 mb-6 resize-none'
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />

          {/* Country and Date Selection */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8'>
            <div className='relative'>
              <label htmlFor="country" className='block text-sm font-medium text-gray-700 mb-2'>
                <FiMap className="inline-block mr-2" />
                Destination Country
              </label>
              <select 
                id="country" 
                className='w-full p-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 appearance-none bg-white'
                value={formData.country_name}
                onChange={(e) => setFormData(prev => ({ ...prev, country_name: e.target.value }))}
              >
                <option value="">Select a country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.name}>{country.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-12 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div>
              <label htmlFor="date" className='block text-sm font-medium text-gray-700 mb-2'>
                <FiCalendar className="inline-block mr-2" />
                Visit Date
              </label>
              <input 
                type="date" 
                id="date" 
                className='w-full p-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200'
                value={formData.visit_date}
                onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Rich Text Editor */}
          <div className="mb-8">
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Share your story
            </label>
            <div className="border border-gray-200 rounded-lg">
              <RichTextEditor value={value} setValue={setValue} />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md 
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-blue-800 hover:shadow-lg'}`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>{isEditing ? 'Updating...' : 'Publishing...'}</span>
                </div>
              ) : (
                <span>{isEditing ? 'Update Story' : 'Publish Story'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;
