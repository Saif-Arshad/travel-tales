"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from "next/image";

export default function Homepage() {

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
}
const router = useRouter();
const [latestBlogs, setLatestBlogs] = useState<BlogPost[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
    fetchLatestBlogs();
}, []);

const fetchLatestBlogs = async () => {
    try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs`);
        setLatestBlogs(response.data.slice(0, 3));
    } catch (error) {
        console.error('Error fetching latest blogs:', error);
    } finally {
        setLoading(false);
    }
};
  return (
    <>
    <div className='w-full'> 
        <div  className='flex  relative flex-col'>
            <video className='h-[75vh]  w-screen object-cover' src={'https://utfs.io/f/71eb9a0e-1214-4254-85f9-c4515eda15f1-a9yobd.mp4'} autoPlay loop muted></video> 
            </div>
    </div>
    <div className="w-full flex items-center justify-center mt-60 sm:mt-40 md:mt-28 relative">
    <div className="w-11/12 flex my-6 flex-col lg:flex-row flex-wrap justify-center">
    <div className="w-full flex itmes-center justify-center lg:w-6/12 ">
        <Image
        src={"/about.png"}
    	 height={500}
         className="object-cover"
          width={500}
        alt="About-Us"
        ></Image>
    </div>
    <div className="w-full lg:w-6/12">
    <h1
  data-aos="fade-up"
  data-aos-anchor-placement="top-bottom"
  className='font-bold text-2xl my-3 md:text-5xl'
>
  TravelTales: <br /> A Global Journey Through Stories
</h1>
<p className='my-3 mt-7 text-lg'>
  Welcome to <strong>TravelTales</strong>, a dynamic platform created as part of the <em>University of Westminster</em>'s School of Computer Science and Engineering coursework. This application empowers users to share personal travel experiences enriched with real-time country data such as flags, currencies, and capital cities. Built using Node.js and integrated with secure user authentication and RESTful APIs, it offers an interactive and socially engaging environment where stories come to life. Explore the world through the eyes of fellow travelers and contribute your own journey today.
</p>
    </div>
    </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Latest Articles</h2>
                    <Link href="/blog" className="flex items-center text-blue-600 hover:text-blue-700">
                        <span className="mr-2">View All</span>
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {latestBlogs.map((blog) => (
                        <Link key={blog.id} href={`/blogs/${blog.id}`}>
                            <div className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="relative h-48">
                                    <img
                                        src={blog.main_image || "/default-blog-cover.jpg"}
                                        alt={blog.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-white font-bold text-xl line-clamp-2">{blog.title}</h3>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{blog.description}</p>
                                    
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>{new Date(blog.visit_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            <span>{blog.country_name}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                        <img
                                            src={blog.user?.profile_picture || "/default-profile.png"}
                                            alt={blog.user?.name || "Author"}
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            {blog.user?.name || "Unknown Author"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
            </div>
        </div>
    <section className="bg-white my-8 mt-20">
        <div className="py-4 px-2 mx-auto max-w-screen-xl sm:py-4 lg:px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Explore by Continent</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 h-full">
                <div className="col-span-2 sm:col-span-1 md:col-span-2 bg-gray-50 h-auto md:h-full flex flex-col">
                    <Link 
                        href="/blog?search=Europe&type=country" 
                        className="group relative flex flex-col overflow-hidden rounded-lg px-4 pb-4 pt-40 flex-grow"
                    >
                        <Image
                            src="/europe.avif"
                            layout="fill"
                            alt="Europe"
                            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/25 to-gray-900/5" />
                        <h3 className="z-10 text-2xl font-medium text-white absolute top-0 left-0 p-4 xs:text-xl md:text-3xl">Europe</h3>
                    </Link>
                </div>
                <div className="col-span-2 sm:col-span-1 md:col-span-2 bg-stone-50">
                    <Link 
                        href="/blog?search=North America&type=country"
                        className="group relative flex flex-col overflow-hidden rounded-lg px-4 pb-4 pt-40 mb-4"
                    >
                        <Image
                            src="/north america.jpg"
                            layout="fill"
                            alt="North America"
                            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/25 to-gray-900/5" />
                        <h3 className="z-10 text-2xl font-medium text-white absolute top-0 left-0 p-4 xs:text-xl md:text-3xl">North America</h3>
                    </Link>
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-2">
                        <Link 
                            href="/blog?search=Africa&type=country"
                            className="group relative flex flex-col overflow-hidden rounded-lg px-4 pb-4 pt-40"
                        >
                            <Image
                                src="/africs.jpg"
                                layout="fill"
                                alt="Africa"
                                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/25 to-gray-900/5" />
                            <h3 className="z-10 text-2xl font-medium text-white absolute top-0 left-0 p-4 xs:text-xl md:text-3xl">Africa</h3>
                        </Link>
                        <Link 
                            href="/blog?search=Asia&type=country"
                            className="group relative flex flex-col overflow-hidden rounded-lg px-4 pb-4 pt-40"
                        >
                            <Image
                                src="/asia.jpg"
                                layout="fill"
                                alt="Asia"
                                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/25 to-gray-900/5" />
                            <h3 className="z-10 text-2xl font-medium text-white absolute top-0 left-0 p-4 xs:text-xl md:text-3xl">Asia</h3>
                        </Link>
                    </div>
                </div>
                <div className="col-span-2 sm:col-span-1 md:col-span-1 bg-sky-50 h-auto md:h-full flex flex-col">
                    <Link 
                        href="/blog?search=Antarctica&type=country"
                        className="group relative flex flex-col overflow-hidden rounded-lg px-4 pb-4 pt-40 flex-grow"
                    >
                        <Image
                            src="/antarctia.jpeg"
                            layout="fill"
                            alt="Antarctica"
                            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/25 to-gray-900/5" />
                        <h3 className="z-10 text-2xl font-medium text-white absolute top-0 left-0 p-4 xs:text-xl md:text-3xl">Antarctica</h3>
                    </Link>
                </div>
            </div>
        </div>
    </section>
    </>
  );
}
