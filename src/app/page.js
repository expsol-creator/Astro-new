"use client";
import React, { Suspense, lazy, useState, useEffect } from "react";

// Lazy load the heavy 3D components
const Global = lazy(() => import("./components/model"));
const Scene = lazy(() => import("./components/Horoscope"));

// Enhanced loading component with progress indication
const LoadingScreen = ({ message = "Loading Solar System..." }) => (
  <div className="flex items-center justify-center min-h-screen bg-black text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
      <p className="text-xl mb-2">{message}</p>
      <p className="text-sm opacity-70">Preparing 3D models and textures</p>
      <div className="mt-4 w-64 bg-gray-700 rounded-full h-2 mx-auto">
        <div
          className="bg-white h-2 rounded-full animate-pulse"
          style={{ width: "60%" }}
        ></div>
      </div>
    </div>
  </div>
);

const Home = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent SSR rendering of 3D content
  if (!isClient) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Global />
      </Suspense>
      {/* <Suspense fallback={<LoadingScreen message="Loading Horoscope..." />}>
        <Scene />
      </Suspense> */}
    </>
  );
};

export default Home;