import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-600 to-indigo-900 text-white py-10 md:py-20">
        <div className="wrapper flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col justify-center gap-6 md:gap-8 max-w-md md:max-w-lg">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Unleash Extraordinary Events with Effortless Hosting
            </h1>
            <p className="text-lg md:text-xl opacity-80">
              Discover event planning at its finest. Book mentors, connect with
              experts, and learn from world-class professionals with a community
              of 3,168+ trusted mentors.
            </p>
            <Button
              size="lg"
              asChild
              className="px-8 py-4 bg-white text-blue-700 rounded-md shadow-lg hover:bg-blue-50 transition duration-300 w-full sm:w-auto"
            >
              <Link href="#events">Explore Events</Link>
            </Button>
          </div>
          <div className="relative w-full max-w-xl md:max-w-2xl">
            <Image
              src="/assets/images/hero.png"
              alt="Exciting event scene"
              width={1000}
              height={1000}
              className="rounded-lg shadow-xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section
        id="events"
        className="wrapper my-16 flex flex-col items-center gap-10"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center">
          Trusted by Thousands of Events Worldwide
        </h2>

        <p className="text-center max-w-2xl text-lg md:text-xl text-gray-600">
          Join our network of event planners, creators, and mentors. Explore
          exclusive access to tools, tips, and insights for hosting and
          connecting seamlessly.
        </p>

        <div className="flex w-full flex-col gap-5 md:flex-row justify-around mt-6">
          {/* Add any event cards, stats, or images here */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:w-1/3 text-center">
            <h3 className="text-xl font-semibold text-indigo-700 mb-4">
              3000+ Successful Events
            </h3>
            <p className="text-gray-600">
              From corporate galas to community gatherings, we ve empowered
              thousands of hosts to deliver unforgettable events.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 md:w-1/3 text-center">
            <h3 className="text-xl font-semibold text-indigo-700 mb-4">
              200+ Expert Mentors
            </h3>
            <p className="text-gray-600">
              Connect with professionals who bring years of experience and
              insight to help you plan the perfect event.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
