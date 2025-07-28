"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
;import { OrbitControls, useGLTF, Environment, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// Create dark golden material
const goldenMaterial = new THREE.MeshStandardMaterial({
  color: '#FFDBC9',
  metalness: 0.8,
  roughness: 0.2,
  emissive: '#332200',
  emissiveIntensity: 0.5
});

function SagittariusModel(props) {
  const glb = useGLTF('/Saggitaruis.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={glb.nodes.geometry_0.geometry}
        material={goldenMaterial}
      />
    </group>
  );
}

function AriesModel(props) {
  const glb = useGLTF('/Aries.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={glb.nodes.geometry_0.geometry}
        material={goldenMaterial}
      />
    </group>
  );
}

function Aquarius(props) {
  const glb = useGLTF('/Aquarius.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={glb.nodes.geometry_0.geometry}
        material={goldenMaterial}
      />
    </group>
  );
}
function Taurus(props) {
  const glb = useGLTF('/Taurus.glb');
  return (
    <group {...props} dispose={null}>
    <mesh
      castShadow
      receiveShadow
      geometry={glb.nodes.geometry_0.geometry}
      material={goldenMaterial}/>  
    </group>
  );
}

function Gemini(props) {
  const glb = useGLTF('/Gemini.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={glb.nodes.geometry_0.geometry}
        material={goldenMaterial}
      />
    </group>
  );
}

function Cancer(props) {
  const glb = useGLTF('/Cancer.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={glb.nodes.geometry_0.geometry}
        material={goldenMaterial}
      />
    </group>
  );
}

function Leo(props) {
  const glb = useGLTF('/Leo.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={glb.nodes.geometry_0.geometry}
        material={goldenMaterial}
      />
    </group>
  );
}

function Virgo(props) {
  const glb = useGLTF('/Virgo.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={glb.nodes.geometry_0.geometry}
        material={goldenMaterial}
      />
    </group>
  );
}

function Libra(props) {
  const glb = useGLTF('/Libra.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={glb.nodes.geometry_0.geometry}
        material={goldenMaterial}
      />
    </group>
  );
}

function Scorpio(props) {
  const glb = useGLTF('/Scorpio.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={glb.nodes.geometry_0.geometry}
        material={goldenMaterial}
      />
    </group>
  );
}

function Capricorn(props) {
  const glb = useGLTF('/Capricorn.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={glb.nodes.geometry_0.geometry}
        material={goldenMaterial}
      />
    </group>
  );
}

function Pisces(props) {
  const glb = useGLTF('/Pisces.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={glb.nodes.geometry_0.geometry}
        material={goldenMaterial}
      />
    </group>
  );
}

// Human model components
function IndianWomanModel({ scale }) {
  const glb = useGLTF('/indian_woman_in_saree.glb');
  const { actions, names } = useAnimations(glb.animations, glb.scene);

  useEffect(() => {
    // Play "hello" animation if available, fallback to first
    let helloName = names?.find(n => n.toLowerCase().includes('hello')) || names?.[0];
    if (helloName && actions && actions[helloName]) {
      actions[helloName].reset().fadeIn(0.2).play();
    }
    // Log available animations
    if (glb.animations && glb.animations.length > 0) {
      console.log('IndianWomanModel animations:', glb.animations.map(a => a.name));
    } else {
      console.log('IndianWomanModel: No animations found');
    }
    return () => {
      if (helloName && actions && actions[helloName]) {
        actions[helloName].fadeOut(0.2).stop();
      }
    };
  }, [glb, actions, names]);

  return (
    <group>
      <primitive object={glb.scene} scale={scale} position={[-1, 0, 0]} />
    </group>
  );
}

function IndianTeenagerModel({ scale }) {
  const glb = useGLTF('/indian_teenager.glb');
  const { actions, names } = useAnimations(glb.animations, glb.scene);

  useEffect(() => {
    // Play "hello" animation if available, fallback to first
    let helloName = names?.find(n => n.toLowerCase().includes('hello')) || names?.[0];
    if (helloName && actions && actions[helloName]) {
      actions[helloName].reset().fadeIn(0.2).play();
    }
    // Log available animations
    if (glb.animations && glb.animations.length > 0) {
      console.log('IndianTeenagerModel animations:', glb.animations.map(a => a.name));
    } else {
      console.log('IndianTeenagerModel: No animations found');
    }
    return () => {
      if (helloName && actions && actions[helloName]) {
        actions[helloName].fadeOut(0.2).stop();
      }
    };
  }, [glb, actions, names]);

  return (
    <group>
      <primitive object={glb.scene} scale={scale} position={[1, 0, 0]} />
    </group>
  );
}

// Zodiac information data
const zodiacInfo = {
  Aries: {
    name: "Aries",
    dates: "March 21 - April 19",
    element: "Fire",
    description: "Bold, ambitious, and energetic. Natural leaders who love challenges."
  },
  Taurus: {
    name: "Taurus",
    dates: "April 20 - May 20",
    element: "Earth",
    description: "Reliable, patient, and practical. Values stability and comfort."
  },
  Gemini: {
    name: "Gemini",
    dates: "May 21 - June 20",
    element: "Air",
    description: "Curious, adaptable, and communicative. Quick-witted and versatile."
  },
  Cancer: {
    name: "Cancer",
    dates: "June 21 - July 22",
    element: "Water",
    description: "Nurturing, intuitive, and protective. Deeply emotional and caring."
  },
  Leo: {
    name: "Leo",
    dates: "July 23 - August 22",
    element: "Fire",
    description: "Confident, generous, and dramatic. Natural performers who love attention."
  },
  Virgo: {
    name: "Virgo",
    dates: "August 23 - September 22",
    element: "Earth",
    description: "Analytical, helpful, and perfectionist. Detail-oriented and practical."
  },
  Libra: {
    name: "Libra",
    dates: "September 23 - October 22",
    element: "Air",
    description: "Diplomatic, charming, and balanced. Seeks harmony and fairness."
  },
  Scorpio: {
    name: "Scorpio",
    dates: "October 23 - November 21",
    element: "Water",
    description: "Intense, passionate, and mysterious. Deeply intuitive and transformative."
  },
  Sagittarius: {
    name: "Sagittarius",
    dates: "November 22 - December 21",
    element: "Fire",
    description: "Adventurous, optimistic, and philosophical. Loves freedom and exploration."
  },
  Capricorn: {
    name: "Capricorn",
    dates: "December 22 - January 19",
    element: "Earth",
    description: "Ambitious, disciplined, and responsible. Goal-oriented and practical."
  },
  Aquarius: {
    name: "Aquarius",
    dates: "January 20 - February 18",
    element: "Air",
    description: "Independent, innovative, and humanitarian. Visionary and unconventional."
  },
  Pisces: {
    name: "Pisces",
    dates: "February 19 - March 20",
    element: "Water",
    description: "Compassionate, artistic, and intuitive. Dreamy and emotionally deep."
  }
};

// Hover-enabled zodiac model wrapper
function HoverableZodiacModel({ children, zodiacName, onHover, onUnhover }) {
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(zodiacName, e);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'default';
        onUnhover();
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (zodiacName) {
          onHover(zodiacName, e);
        }
      }}
    >
      {children}
    </group>
  );
}

// Popup component
function ZodiacPopup({ zodiac, position, visible }) {
  if (!visible || !zodiac) return null;

  const info = zodiacInfo[zodiac];

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x + 10,
        top: position.y - 10,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: '#FFD700',
        padding: '15px',
        borderRadius: '10px',
        border: '2px solid #FFD700',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '250px',
        zIndex: 1000,
        pointerEvents: 'none',
        boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)'
      }}
    >
      <h3 style={{ margin: '0 0 8px 0', color: '#FFD700', fontSize: '18px' }}>
        {info.name}
      </h3>
      <p style={{ margin: '4px 0', fontSize: '12px', color: '#FFF' }}>
        <strong>Dates:</strong> {info.dates}
      </p>
      <p style={{ margin: '4px 0', fontSize: '12px', color: '#FFF' }}>
        <strong>Element:</strong> {info.element}
      </p>
      <p style={{ margin: '8px 0 0 0', fontSize: '12px', lineHeight: '1.4' }}>
        {info.description}
      </p>
    </div>
  );
}

function RotatingZodiacCircle({ onHover, onUnhover, fov }) {
  const groupRef = useRef();

  // Adjust scale based on FOV (smaller FOV = larger models, larger FOV = smaller models)
  const baseScale = 1.2;
  const scale = Math.max(0.5, Math.min(1.5, baseScale * (60 / fov)));

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.1;
      groupRef.current.children.forEach((child) => {
        if (child.children.length > 0) {
          child.children.forEach((nestedChild) => {
            nestedChild.rotation.z -= delta * 0.1;
          });
        } else {
          child.rotation.z -= delta * 0.2;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Human models in the center */}
      <group rotation={[0, 0, 0]} position={[0, 0, 2]} scale={0.8}>
        <IndianWomanModel scale={scale} />
        <IndianTeenagerModel scale={scale} />
      </group>
      {/* 12 Zodiac models arranged in a circle with hover functionality */}
      <HoverableZodiacModel zodiacName="Aries" onHover={onHover} onUnhover={onUnhover}>
        <AriesModel position={[6, 0, 0]} scale={0.8} rotation={[0, 0, 0]} />
      </HoverableZodiacModel>
      
      <HoverableZodiacModel zodiacName="Taurus" onHover={onHover} onUnhover={onUnhover}>
        <Taurus position={[5.2, 3, 0]} scale={0.8} rotation={[0, 0, -Math.PI/6]} />
      </HoverableZodiacModel>
      
      <HoverableZodiacModel zodiacName="Gemini" onHover={onHover} onUnhover={onUnhover}>
        <Gemini position={[3, 5.2, 0]} scale={0.8} rotation={[0, 0, -Math.PI/3]} />
      </HoverableZodiacModel>
      
      <HoverableZodiacModel zodiacName="Cancer" onHover={onHover} onUnhover={onUnhover}>
        <Cancer position={[0, 6, 0]} scale={0.8} rotation={[0, 0, -Math.PI/2]} />
      </HoverableZodiacModel>
      
      <HoverableZodiacModel zodiacName="Leo" onHover={onHover} onUnhover={onUnhover}>
        <Leo position={[-3, 5.2, 0]} scale={0.8} rotation={[0, 0, -2*Math.PI/3]} />
      </HoverableZodiacModel>
      
      <HoverableZodiacModel zodiacName="Virgo" onHover={onHover} onUnhover={onUnhover}>
        <Virgo position={[-5.2, 3, 0]} scale={0.8} rotation={[0, 0, -5*Math.PI/6]} />
      </HoverableZodiacModel>
      
      <HoverableZodiacModel zodiacName="Libra" onHover={onHover} onUnhover={onUnhover}>
        <Libra position={[-6, 0, 0]} scale={0.8} rotation={[0, 0, -Math.PI]} />
      </HoverableZodiacModel>
      
      <HoverableZodiacModel zodiacName="Scorpio" onHover={onHover} onUnhover={onUnhover}>
        <Scorpio position={[-5.2, -3, 0]} scale={0.8} rotation={[0, 0, -7*Math.PI/6]} />
      </HoverableZodiacModel>
      
      <HoverableZodiacModel zodiacName="Sagittarius" onHover={onHover} onUnhover={onUnhover}>
        <SagittariusModel position={[-3, -5.2, 0]} scale={0.8} rotation={[0, 0, -4*Math.PI/3]} />
      </HoverableZodiacModel>
      
      <HoverableZodiacModel zodiacName="Capricorn" onHover={onHover} onUnhover={onUnhover}>
        <Capricorn position={[0, -6, 0]} scale={0.8} rotation={[0, 0, -3*Math.PI/2]} />
      </HoverableZodiacModel>
      
      <HoverableZodiacModel zodiacName="Aquarius" onHover={onHover} onUnhover={onUnhover}>
        <Aquarius position={[3, -5.2, 0]} scale={0.8} rotation={[0, 0, -5*Math.PI/3]} />
      </HoverableZodiacModel>
      
      <HoverableZodiacModel zodiacName="Pisces" onHover={onHover} onUnhover={onUnhover}>
        <Pisces position={[5.2, -3, 0]} scale={0.8} rotation={[0, 0, -11*Math.PI/6]} />
      </HoverableZodiacModel>
    </group>
  );
}

export default function Scene() {
  const [hoveredZodiac, setHoveredZodiac] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [fov, setFov] = useState(60);

  // Responsive FOV calculation
  useEffect(() => {
    setIsClient(true);

    function getResponsiveFov() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Adjust FOV based on both width and height for better responsiveness
      if (width < 500 || height < 500) return 95;
      if (width < 900 || height < 700) return 75;
      return 60;
    }

    function handleResize() {
      setFov(getResponsiveFov());
    }

    setFov(getResponsiveFov());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHover = (zodiacName, event) => {
    setHoveredZodiac(zodiacName);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleUnhover = () => {
    setHoveredZodiac(null);
  };

  // Only render on client side to avoid hydration mismatch
  if (!isClient) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100%', 
        backgroundColor: '#000000', // changed to black
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: '#FFF'
      }}>
        Loading 3D Scene...
      </div>
    );
  }

  return (
    <>
      <Canvas
        style={{ 
          height: '100vh', 
          width: '100%'
        }}
        camera={{ position: [0, 0, 10], fov: fov }}
        shadows
        onPointerMissed={() => {
          document.body.style.cursor = 'default';
          setHoveredZodiac(null);
        }}
      >
        {/* Black background color */}
        <color attach="background" args={['#000000']} />
        
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={1024}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <RotatingZodiacCircle onHover={handleHover} onUnhover={handleUnhover} fov={fov} />
        
        {/* Controls for the scene */}
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
          makeDefault
        />
        <Environment preset="sunset" />
      </Canvas>
      
      <ZodiacPopup 
        zodiac={hoveredZodiac}
        position={mousePosition}
        visible={!!hoveredZodiac}
      />
    </>
  );
}

// Preload all models
useGLTF.preload('/Saggitaruis.glb');
useGLTF.preload('/Aries.glb');
useGLTF.preload('/Taurus.glb');
useGLTF.preload('/Gemini.glb');
useGLTF.preload('/Cancer.glb');
useGLTF.preload('/Leo.glb');
useGLTF.preload('/Virgo.glb');
useGLTF.preload('/Libra.glb');
useGLTF.preload('/Scorpio.glb');
useGLTF.preload('/Capricorn.glb');
useGLTF.preload('/Aquarius.glb');
useGLTF.preload('/Pisces.glb');
useGLTF.preload('/indian_woman_in_saree.glb');
useGLTF.preload('/indian_teenager.glb');