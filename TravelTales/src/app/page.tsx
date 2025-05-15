import Image from "next/image";

export default function Homepage() {



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
    <section className="bg-white my-8 mt-20">
  <div className="py-4 px-2 mx-auto max-w-screen-xl sm:py-4 lg:px-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 h-full">
      <div className="col-span-2 sm:col-span-1 md:col-span-2 bg-gray-50 h-auto md:h-full flex flex-col">
        <a  className="group relative flex flex-col overflow-hidden rounded-lg px-4 pb-4 pt-40 flex-grow">
          <Image
           src={"/europe.avif"}
           layout="fill"
           alt="africa"
           className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/25 to-gray-900/5" />
          <h3 className="z-10 text-2xl font-medium text-white absolute top-0 left-0 p-4 xs:text-xl md:text-3xl">Europe</h3>
        </a>
      </div>
      <div className="col-span-2 sm:col-span-1 md:col-span-2 bg-stone-50">
        <a  className="group relative flex flex-col overflow-hidden rounded-lg px-4 pb-4 pt-40 mb-4">
          <Image
              src={"/north america.jpg"}

           layout="fill"
           alt="america"
             className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/25 to-gray-900/5" />
          <h3 className="z-10 text-2xl font-medium text-white absolute top-0 left-0 p-4 xs:text-xl md:text-3xl">North America</h3>
        </a>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-2">
          <a  className="group relative flex flex-col overflow-hidden rounded-lg px-4 pb-4 pt-40">
            <Image
           src={"/africs.jpg"}
           layout="fill"
           alt="north america"
          className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/25 to-gray-900/5" />
            <h3 className="z-10 text-2xl font-medium text-white absolute top-0 left-0 p-4 xs:text-xl md:text-3xl"> Africa</h3>
          </a>
          <a  className="group relative flex flex-col overflow-hidden rounded-lg px-4 pb-4 pt-40">
          <Image
           src={"/asia.jpg"}
           layout="fill"
           alt="Asia"
 className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/25 to-gray-900/5" />
            <h3 className="z-10 text-2xl font-medium text-white absolute top-0 left-0 p-4 xs:text-xl md:text-3xl">Asia</h3>
          </a>
        </div>
      </div>
      <div className="col-span-2 sm:col-span-1 md:col-span-1 bg-sky-50 h-auto md:h-full flex flex-col">
        <a  className="group relative flex flex-col overflow-hidden rounded-lg px-4 pb-4 pt-40 flex-grow">
        <Image
           src={"/antarctia.jpeg"}
           layout="fill"
           alt="europe"
   className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/25 to-gray-900/5" />
          <h3 className="z-10 text-2xl font-medium text-white absolute top-0 left-0 p-4 xs:text-xl md:text-3xl">Anctarctica</h3>
        </a>
      </div>  
    </div>
  </div>
</section>

    </>
  );
}
