"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, useTexture, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

const GlowMaterial = shaderMaterial(
  {
    map: null,
    glowCenter: new THREE.Vector3(0, 0, 0),
    glowRadius: 0.4,
    glowIntensity: 0.0,
    glowColor: new THREE.Color(0x66ccff),
    time: 0,
    viewVector: new THREE.Vector3(),
  },
  `varying vec2 vUv; varying vec3 vPosition; varying vec3 vNormal; varying vec3 vViewPosition; void main() { vUv = uv; vPosition = position; vNormal = normal; vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  `uniform sampler2D map; uniform vec3 glowCenter; uniform float glowRadius; uniform float glowIntensity; uniform vec3 glowColor; uniform float time; uniform vec3 viewVector; varying vec2 vUv; varying vec3 vPosition; varying vec3 vNormal; varying vec3 vViewPosition; void main() { vec4 texColor = texture2D(map, vUv); float dist = distance(vPosition, glowCenter); float glowBase = smoothstep(glowRadius, 0.0, dist) * glowIntensity; vec3 viewDir = normalize(vViewPosition); float glowFactor = max(0.0, dot(vNormal, viewDir)) * 2.0; float dynamicGlow = glowBase * (1.0 + sin(time * 3.0 + vPosition.y) * 0.3 + glowFactor); vec3 finalColor = mix(texColor.rgb, glowColor, dynamicGlow * 0.5); gl_FragColor = vec4(finalColor, 1.0); }`
);

const SunMaterial = shaderMaterial(
  {
    map: null,
    time: 0,
    viewVector: new THREE.Vector3(),
    glowIntensity: 3.0,
    shadowIntensity: 0.3,
  },
  `varying vec2 vUv; 
   varying vec3 vPosition; 
   varying vec3 vNormal; 
   varying vec3 vWorldPosition;
   varying vec3 vViewPosition;
   uniform float time;
   
   void main() { 
     vUv = uv; 
     vPosition = position; 
     vNormal = normalize(normalMatrix * normal);
     vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
     vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
     
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
   }`,
  `uniform sampler2D map; 
   uniform float time; 
   uniform vec3 viewVector;
   uniform float glowIntensity;
   uniform float shadowIntensity;
   varying vec2 vUv; 
   varying vec3 vPosition; 
   varying vec3 vNormal;
   varying vec3 vWorldPosition;
   varying vec3 vViewPosition;
   
   void main() { 
     vec4 texColor = texture2D(map, vUv);
     
     vec3 viewDir = normalize(cameraPosition - vWorldPosition);
     float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
     
     // Front glow effect
     float frontGlow = pow(fresnel, 2.0) * glowIntensity;
     
     // Back shadow effect
     float backShadow = max(0.0, dot(vNormal, viewDir));
     backShadow = 1.0 - (backShadow * shadowIntensity);
     
     // Animated surface effects (only affecting color, not geometry)
     float surface = sin(time * 4.0 + vUv.x * 10.0) * 0.1 + 0.9;
     surface *= cos(time * 3.0 + vUv.y * 8.0) * 0.1 + 0.9;
     
     // Corona effect
     vec3 coronaColor = vec3(1.0, 0.6, 0.1);
     vec3 coreColor = vec3(1.0, 0.8, 0.3);
     
     vec3 sunColor = mix(coreColor, coronaColor, fresnel);
     sunColor *= surface;
     sunColor *= backShadow;
     
     // Add glow
     vec3 glowColor = vec3(1.0, 0.5, 0.0);
     vec3 finalColor = sunColor + (glowColor * frontGlow * 0.5);
     
     // Enhance brightness
     finalColor *= texColor.rgb * 2.0;
     
     gl_FragColor = vec4(finalColor, 1.0); 
   }`
);

extend({ GlowMaterial, SunMaterial });

function Stars() {
  const starsRef = useRef();
  const [positions, setPositions] = useState(null);

  useEffect(() => {
    const starPositions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 100;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    setPositions(starPositions);
  }, []);

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.material.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  if (!positions) return null;

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        uniforms={{
          time: { value: 0 },
          size: { value: 2.0 },
        }}
        vertexShader={`
          uniform float time;
          uniform float size;
          attribute float randomness;
          
          void main() {
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            
            gl_Position = projectedPosition;
            gl_PointSize = size * (1.0 + sin(time * 2.0 + position.x * 0.01) * 0.5);
          }
        `}
        fragmentShader={`
          uniform float time;
          
          void main() {
            float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
            if (distanceToCenter > 0.5) discard;
            
            float alpha = 1.0 - distanceToCenter * 2.0;
            float twinkle = sin(time * 3.0 + gl_FragCoord.x * 0.1 + gl_FragCoord.y * 0.1) * 0.3 + 0.7;
            
            gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * twinkle);
          }
        `}
        transparent={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ShootingStars() {
  const shootingStarsRef = useRef();
  const [shootingStarPositions, setShootingStarPositions] = useState(null);

  useEffect(() => {
    const starCount = 5;
    const positions = new Float32Array(starCount * 6); // 2 points per line (start and end)
    
    for (let i = 0; i < starCount; i++) {
      const i6 = i * 6;
      // Random starting position
      const startX = (Math.random() - 0.5) * 150;
      const startY = (Math.random() - 0.5) * 150;
      const startZ = (Math.random() - 0.5) * 150;
      
      // Direction for shooting star trail
      const dirX = (Math.random() - 0.5) * 20;
      const dirY = (Math.random() - 0.5) * 20;
      const dirZ = (Math.random() - 0.5) * 20;
      
      // Start point
      positions[i6] = startX;
      positions[i6 + 1] = startY;
      positions[i6 + 2] = startZ;
      
      // End point (trail)
      positions[i6 + 3] = startX + dirX;
      positions[i6 + 4] = startY + dirY;
      positions[i6 + 5] = startZ + dirZ;
    }
    
    setShootingStarPositions(positions);
  }, []);

  useFrame((state) => {
    if (shootingStarsRef.current && shootingStarPositions) {
      const time = state.clock.elapsedTime;
      const positionAttribute = shootingStarsRef.current.geometry.attributes.position;
      
      // Animate shooting stars every 5 seconds
      for (let i = 0; i < shootingStarPositions.length / 6; i++) {
        const i6 = i * 6;
        const cycleTime = time % 5; // 5 second cycle
        const starDelay = i * 0.3; // Stagger each star slightly
        const effectiveTime = (cycleTime - starDelay + 5) % 5;
        
        if (effectiveTime < 1.5) { // Show shooting star for 1.5 seconds
          const progress = effectiveTime / 1.5;
          const speed = 30;
          
          positionAttribute.array[i6] = shootingStarPositions[i6] + progress * speed * Math.cos(i);
          positionAttribute.array[i6 + 1] = shootingStarPositions[i6 + 1] + progress * speed * Math.sin(i);
          positionAttribute.array[i6 + 2] = shootingStarPositions[i6 + 2] + progress * speed * 0.5;
          
          positionAttribute.array[i6 + 3] = shootingStarPositions[i6 + 3] + progress * speed * Math.cos(i);
          positionAttribute.array[i6 + 4] = shootingStarPositions[i6 + 4] + progress * speed * Math.sin(i);
          positionAttribute.array[i6 + 5] = shootingStarPositions[i6 + 5] + progress * speed * 0.5;
        } else {
          // Hide shooting star when not active
          positionAttribute.array[i6] = 999;
          positionAttribute.array[i6 + 1] = 999;
          positionAttribute.array[i6 + 2] = 999;
          positionAttribute.array[i6 + 3] = 999;
          positionAttribute.array[i6 + 4] = 999;
          positionAttribute.array[i6 + 5] = 999;
        }
      }
      positionAttribute.needsUpdate = true;
    }
  });

  if (!shootingStarPositions) return null;

  return (
    <line ref={shootingStarsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={shootingStarPositions.length / 3}
          array={shootingStarPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={0xffffff}
        transparent
        opacity={0.9}
        linewidth={3}
      />
    </line>
  );
}

function SaturnRings({ position }) {
  const ringsRef = useRef();

  useFrame((state, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.z += delta * 0.02;
    }
  });

  return (
    <group ref={ringsRef} position={position} rotation={[Math.PI / 2 + 0.1, 0, 0]}>
      {/* A Ring (outermost) */}
      <mesh>
        <ringGeometry args={[1.8, 2.2, 128]} />
        <meshBasicMaterial
          color={0xc8b99c}
          transparent={true}
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Cassini Division (gap) */}
      
      {/* B Ring (brightest and most prominent) */}
      <mesh>
        <ringGeometry args={[1.4, 1.75, 128]} />
        <meshBasicMaterial
          color={0xe6ddd4}
          transparent={true}
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* C Ring (innermost, more transparent) */}
      <mesh>
        <ringGeometry args={[1.1, 1.35, 128]} />
        <meshBasicMaterial
          color={0x9d8f7f}
          transparent={true}
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* D Ring (very faint, closest to planet) */}
      <mesh>
        <ringGeometry args={[1.05, 1.08, 64]} />
        <meshBasicMaterial
          color={0x8b7d6b}
          transparent={true}
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function EarthModel({ isAnimating, glowCenter, glowIntensity, texturePath, position }) {
  const earthRef = useRef();
  const materialRef = useRef();
  const texture = useTexture(texturePath);

  useFrame((state, delta) => {
    if (earthRef.current) {
      if (!isAnimating) {
        earthRef.current.rotation.y += delta * 0.1;
      }
      if (materialRef.current) {
        materialRef.current.viewVector = state.camera.position.clone().normalize();
        materialRef.current.time = state.clock.elapsedTime;
      }
    }
  });

  return (
    <mesh
      ref={earthRef}
      scale={0.8}
      position={position}
      onPointerOver={() => {}}
      onPointerOut={() => {}}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <glowMaterial
        ref={materialRef}
        map={texture}
        glowCenter={glowCenter}
        glowRadius={0.4}
        glowCi
        glowIntensity={glowIntensity}
        glowColor={new THREE.Color(0x66ccff)}
        time={0}
        viewVector={new THREE.Vector3()}
      />
    </mesh>
  );
}
;
function Sun() {
  const sunRef = useRef();
  const materialRef = useRef();
  const texture = useTexture("/sunmap.jpg");

  useFrame((state, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.05;
      if (materialRef.current) {
        materialRef.current.viewVector = state.camera.position.clone().normalize();
        materialRef.current.time = state.clock.elapsedTime;
      }
    }
  });

  return (
    <group>
      <mesh ref={sunRef} scale={1.5} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <sunMaterial
          ref={materialRef}
          map={texture}
          time={0}
          viewVector={new THREE.Vector3()}
          glowIntensity={3.0}
          shadowIntensity={0.3}
        />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={4} color={0xffaa00} decay={2} />
      <pointLight position={[0, 0, 0]} intensity={1.5} color={0xff6600} decay={1} />
    </group>
  );
}

function Scene({ onIntroComplete, setCurrentPlanet }) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [glowCenter, setGlowCenter] = useState(new THREE.Vector3(0, 0.8, 0.6));
  const [currentPlanetIndex, setCurrentPlanetIndex] = useState(0);
  const orbitControlsRef = useRef();

  const handleIntroComplete = () => {
    setTimeout(() => {
      setIsAnimating(false);
      onIntroComplete();
    }, 500);
  };

  useEffect(() => {
    setGlowIntensity(1.8);
    setGlowCenter(new THREE.Vector3(0, 0.8, 0.6));
    handleIntroComplete();
  }, []);

  // Calculate circular positions for 7 planets with larger gap from sun
  const radius = 7;
  const angleStep = (2 * Math.PI) / 7;
  const planetPositions = [
    [0, 0, 0], // Center Earth
    [radius * Math.cos(0), 0, radius * Math.sin(0)], // Sun at 0°
    [radius * Math.cos(angleStep), 0, radius * Math.sin(angleStep)], // Mars
    [radius * Math.cos(2 * angleStep), 0, radius * Math.sin(2 * angleStep)], // Jupiter
    [radius * Math.cos(3 * angleStep), 0, radius * Math.sin(3 * angleStep)], // Saturn
    [radius * Math.cos(4 * angleStep), 0, radius * Math.sin(4 * angleStep)], // Uranus
    [radius * Math.cos(5 * angleStep), 0, radius * Math.sin(5 * angleStep)], // Neptune
    [radius * Math.cos(6 * angleStep), 0, radius * Math.sin(6 * angleStep)], // Venus
  ];

  const planetData = [
    { texture: "/Earth_imgFinal0.jpg", name: "Earth" },
    { texture: "/sunmap.jpg", name: "Sun" },
    { texture: "/mars_1k_color.jpg", name: "Mars" },
    { texture: "/jupitermap.jpg", name: "Jupiter" },
    { texture: "/saturnmap.jpg", name: "Saturn" },
    { texture: "/uranusmap.jpg", name: "Uranus" },
    { texture: "/neptunemap.jpg", name: "Neptune" },
    { texture: "/venusmap.jpg", name: "Venus" },
  ];

  useEffect(() => {
    const handleWheel = (event) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 1 : -1;
      setCurrentPlanetIndex((prev) => {
        const newIndex = (prev + delta + planetData.length) % planetData.length;
        setCurrentPlanet(planetData[newIndex].name);
        return newIndex;
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [planetData.length, setCurrentPlanet]);

  useFrame((state) => {
    if (state.camera && orbitControlsRef.current) {
      const targetPosition = planetPositions[currentPlanetIndex];
      
      // Update orbit controls target to current planet
      orbitControlsRef.current.target.set(
        targetPosition[0],
        targetPosition[1], 
        targetPosition[2]
      );
      
      // If not rotating manually, smoothly move camera to focus position
      if (!orbitControlsRef.current.enabled || 
          (Math.abs(state.camera.position.x - (targetPosition[0])) > 0.1 ||
           Math.abs(state.camera.position.y - (targetPosition[1])) > 0.1 ||
           Math.abs(state.camera.position.z - (targetPosition[2] + 5)) > 0.1)) {
        
        state.camera.position.lerp(
          new THREE.Vector3(
            targetPosition[0],
            targetPosition[1],
            targetPosition[2] + 5
          ),
          0.05
        );
      }
    }
  });

  return (
    <>
      <Stars />
      <ShootingStars />
      <ambientLight intensity={2.5} />
      <pointLight position={[10, 10, 10]} intensity={2} />
      
      {planetData.map((planet, index) => (
        <EarthModel
          key={index}
          isAnimating={isAnimating}
          glowIntensity={glowIntensity}
          texturePath={planet.texture}
          position={planetPositions[index]}
        />
      ))}
      
      <SaturnRings position={planetPositions[4]} />
      
      <OrbitControls 
        ref={orbitControlsRef}
        enableZoom={true} 
        enableRotate={true} 
        enablePan={false}
        minDistance={2}
        maxDistance={10}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        target={planetPositions[currentPlanetIndex]}
      />
    </>
  );
}

export default function Global() {
  const [introComplete, setIntroComplete] = useState(false);
  const [currentPlanet, setCurrentPlanet] = useState("Earth");

  return (
    <section
      className="relative flex items-center justify-center min-h-screen bg-black text-white"
    >
      <div
        className="w-full h-screen relative z-10 p-2"
      >
        <Canvas
          className="w-full h-screen"
          camera={{ position: [0, 0, 5], fov: 60 }}
        >
          <Scene 
            onIntroComplete={() => setIntroComplete(true)} 
            setCurrentPlanet={setCurrentPlanet}
          />
        </Canvas>
        
        {/* Planet indicator */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          background: 'raddgba(0,0,0,0.5)',
          padding: '10px 20px',
          borderRadius: '10px',
          zIndex: 1000
        }}>
          {currentPlanet}
        </div>
      </div>
    </section>
  );
}