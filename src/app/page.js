"use client";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React from "react";
import Scene from "./components/Horoscope"
import Global from "./components/model";

const Home = () => {
  return (
    <>
      <Global />
      {/* <Scene /> */}
    </>
  );
};

export default Home;