"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, useTexture, shaderMaterial, Html } from "@react-three/drei";
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

const PlanetMaterial = shaderMaterial(
  {
    map: null,
    time: 0,
    sunPosition: new THREE.Vector3(0, 0, 0),
    planetPosition: new THREE.Vector3(0, 0, 0),
    lightIntensity: 1.0,
    ambientStrength: 0.3,
  },
  `varying vec2 vUv; 
   varying vec3 vPosition; 
   varying vec3 vNormal; 
   varying vec3 vWorldPosition;
   uniform float time;
   uniform vec3 sunPosition;
   uniform vec3 planetPosition;
   
   void main() { 
     vUv = uv; 
     vPosition = position; 
     vNormal = normalize(normalMatrix * normal);
     vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
     
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
   }`,
  `uniform sampler2D map; 
   uniform float time; 
   uniform vec3 sunPosition;
   uniform vec3 planetPosition;
   uniform float lightIntensity;
   uniform float ambientStrength;
   varying vec2 vUv; 
   varying vec3 vPosition; 
   varying vec3 vNormal;
   varying vec3 vWorldPosition;
   
   void main() { 
     vec4 texColor = texture2D(map, vUv);
     
     // Calculate light direction from sun to current surface point
     vec3 lightDirection = normalize(sunPosition - vWorldPosition);
     
     // Calculate how much light hits this surface (dot product of normal and light direction)
     float lightDot = max(0.0, dot(vNormal, lightDirection));
     
     // Create smooth day/night transition
     float dayNightTransition = smoothstep(0.0, 0.3, lightDot);
     
     // Add some atmospheric scattering effect
     float atmosphereGlow = pow(1.0 - abs(dot(vNormal, lightDirection)), 2.0) * 0.2;
     
     // Calculate distance falloff from sun
     float distance = length(sunPosition - planetPosition);
     float distanceFalloff = 1.0 / (1.0 + distance * 0.01);
     
     // Combine lighting components
     float finalLight = (ambientStrength + dayNightTransition * lightIntensity * distanceFalloff) + atmosphereGlow;
     
     // Apply subtle color temperature shift (warmer on lit side, cooler on dark side)
     vec3 warmTint = vec3(1.1, 1.0, 0.9);
     vec3 coolTint = vec3(0.8, 0.9, 1.2);
     vec3 colorTint = mix(coolTint, warmTint, dayNightTransition);
     
     // Final color calculation
     vec3 finalColor = texColor.rgb * finalLight * colorTint;
     
     gl_FragColor = vec4(finalColor, texColor.a); 
   }`
);

extend({ GlowMaterial, SunMaterial, PlanetMaterial });

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
      
      // Animate shooting stars every 8 seconds with slower motion
      for (let i = 0; i < shootingStarPositions.length / 6; i++) {
        const i6 = i * 6;
        const cycleTime = time % 8; // 8 second cycle for slower motion
        const starDelay = i * 0.5; // Increased delay between stars
        const effectiveTime = (cycleTime - starDelay + 8) % 8;
        
        if (effectiveTime < 3) { // Show shooting star for 3 seconds
          const progress = effectiveTime / 3;
          const speed = 15; // Reduced speed for slow motion
          
          positionAttribute.array[i6] = shootingStarPositions[i6] + progress * speed * Math.cos(i);
          positionAttribute.array[i6 + 1] = shootingStarPositions[i6 + 1] + progress * speed * Math.sin(i);
          positionAttribute.array[i6 + 2] = shootingStarPositions[i6 + 2] + progress * speed * 0.3;
          
          positionAttribute.array[i6 + 3] = shootingStarPositions[i6 + 3] + progress * speed * Math.cos(i);
          positionAttribute.array[i6 + 4] = shootingStarPositions[i6 + 4] + progress * speed * Math.sin(i);
          positionAttribute.array[i6 + 5] = shootingStarPositions[i6 + 5] + progress * speed * 0.3;
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

function EarthModel({ isAnimating, glowCenter, glowIntensity, texturePath, position, planetInfo, onHover, onHoverOut, viewModeState, planetIndex }) {
  const earthRef = useRef();
  const materialRef = useRef();
  const texture = useTexture(texturePath);

  useFrame((state, delta) => {
    if (earthRef.current) {
      // Planetary rotation speeds (slower for all planets)
      const rotationSpeeds = [
        0.02, // Sun - slower
        0.03, // Mars - slower
        -0.05, // Venus (retrograde) - slower
        0.06, // Mercury - slower
        0.04, // Earth - slower
        0.07, // Jupiter - slower
        0.06, // Saturn - slower
      ];

      // Always rotate on axis
      earthRef.current.rotation.y += delta * (rotationSpeeds[planetIndex] || 0.1);
      
      if (materialRef.current) {
        // Update shader uniforms for lighting
        materialRef.current.time = state.clock.elapsedTime;
        materialRef.current.sunPosition = new THREE.Vector3(0, 0, 0); // Sun is always at origin
        materialRef.current.planetPosition = new THREE.Vector3(position[0], position[1], position[2]);
      }
    }
  });

  // Enhanced Sun rendering with special effects
  if (planetInfo.name === "Sun") {
    return (
      <group position={position}>
        {/* Main Sun mesh */}
        <mesh
          ref={earthRef}
          scale={1.2}
          onPointerOver={() => onHover && onHover(planetInfo)}
          onPointerOut={() => onHoverOut && onHoverOut()}
        >
          <sphereGeometry args={[1, 64, 64]} />
          <sunMaterial
            ref={materialRef}
            map={texture}
            time={0}
            viewVector={new THREE.Vector3()}
            glowIntensity={4.0}
            shadowIntensity={0.2}
          />
        </mesh>
        
        {/* Enhanced lighting for Sun */}
        <pointLight 
          position={[0, 0, 0]} 
          intensity={6} 
          color={0xffaa00} 
          decay={1.5}
          distance={50}
        />
        <pointLight 
          position={[0, 0, 0]} 
          intensity={3} 
          color={0xff6600} 
          decay={1}
          distance={30}
        />
        
        {/* Sun corona glow effect */}
        <mesh scale={1.8}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={0xffaa00}
            transparent={true}
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>
        
        {/* Outer glow ring */}
        <mesh scale={2.2}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial
            color={0xff4400}
            transparent={true}
            opacity={0.05}
            side={THREE.BackSide}
          />
        </mesh>
      </group>
    );
  }

  return (
    <mesh
      ref={earthRef}
      scale={0.8}
      position={position}
      onPointerOver={() => onHover && onHover(planetInfo)}
      onPointerOut={() => onHoverOut && onHoverOut()}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <planetMaterial
        ref={materialRef}
        map={texture}
        time={0}
        sunPosition={new THREE.Vector3(0, 0, 0)}
        planetPosition={new THREE.Vector3(position[0], position[1], position[2])}
        lightIntensity={1.2}
        ambientStrength={0.25}
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

function MilkyWay() {
  const milkyWayRef = useRef();
  const texture = useTexture("/8k_stars_milky_way.jpg");

  useFrame((state, delta) => {
    if (milkyWayRef.current) {
      milkyWayRef.current.rotation.y += delta * 0.001;
    }
  });

  return (
    <mesh ref={milkyWayRef} scale={[200, 200, 200]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial 
        map={texture} 
        side={THREE.BackSide}
        transparent={true}
        opacity={0.8}
      />
    </mesh>
  );
}

function MoonOrbit({ earthPosition, onHover, onHoverOut }) {
  const moonRef = useRef();
  const materialRef = useRef();
  
  // Always call useTexture hook consistently
  const texture = useTexture("/8k_moon.jpg");
  const moonOrbitRadius = 2;

  const moonInfo = {
    name: "Moon",
    description: "Earth's only natural satellite. The Moon influences Earth's tides and has been a subject of human exploration. Rules Cancer in astrology.",
    distance: "238,855 miles from Earth",
    diameter: "2,159 miles"
  };

  useFrame((state, delta) => {
    if (moonRef.current) {
      const time = state.clock.elapsedTime;
      // Moon orbits Earth every 10 seconds
      const moonX = earthPosition[0] + Math.cos(time * 0.6) * moonOrbitRadius;
      const moonY = earthPosition[1] + 0.3; // Position Moon above Earth's plane
      const moonZ = earthPosition[2] + Math.sin(time * 0.6) * moonOrbitRadius;
      
      moonRef.current.position.set(moonX, moonY, moonZ);
      moonRef.current.rotation.y += delta * 0.05;
      
      if (materialRef.current) {
        // Update shader uniforms for lighting
        materialRef.current.time = state.clock.elapsedTime;
        materialRef.current.sunPosition = new THREE.Vector3(0, 0, 0);
        materialRef.current.planetPosition = new THREE.Vector3(moonX, moonY, moonZ);
      }
    }
  });

  return (
    <mesh 
      ref={moonRef} 
      scale={0.3}
      onPointerOver={() => onHover(moonInfo)}
      onPointerOut={() => onHoverOut()}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <planetMaterial
        ref={materialRef}
        map={texture}
        time={0}
        sunPosition={new THREE.Vector3(0, 0, 0)}
        planetPosition={new THREE.Vector3(0, 0, 0)}
        lightIntensity={0.8}
        ambientStrength={0.2}
      />
    </mesh>
  );
}

function PlanetOrbitPath({ planetIndex, viewModeState }) {
  // Don't show orbit for the Sun or if not in overview mode
  if (planetIndex === 0 || viewModeState !== 'overview') {
    return null;
  }

  // Orbital radii matching the dynamic positions
  const orbitalRadii = [
    null, // Sun
    10, // Mars
    7, // Venus
    5.5, // Mercury
    8.5, // Earth
    14, // Jupiter
    18, // Saturn
  ];

  const radius = orbitalRadii[planetIndex];
  if (!radius) return null;

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <ringGeometry args={[radius - 0.05, radius + 0.05, 128]} />
      <meshBasicMaterial
        color={0xffffff}
        transparent={true}
        opacity={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function PlanetAxis({ position, planetIndex, planetInfo, viewModeState }) {
  const axisRef = useRef();

  useFrame((state, delta) => {
    if (axisRef.current) {
      // Planetary rotation speeds (same as in EarthModel)
      const rotationSpeeds = [
        0.02, // Sun - slower
        0.03, // Mars - slower
        -0.05, // Venus (retrograde) - slower
        0.06, // Mercury - slower
        0.04, // Earth - slower
        0.07, // Jupiter - slower
        0.06, // Saturn - slower
      ];

      // Rotate the axis indicator with the planet
      axisRef.current.rotation.y += delta * (rotationSpeeds[planetIndex] || 0.1);
    }
  });

  // Don't show axis for the Sun or if not in overview mode
  if (planetInfo.name === "Sun" || viewModeState !== 'overview') {
    return null;
  }

  return (
    <group ref={axisRef} position={position}>
      {/* Equatorial circle */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1.05, 64]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent={true}
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Axis line (vertical) */}
      <mesh>
        <cylinderGeometry args={[0.015, 0.015, 2.5, 8]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent={true}
          opacity={0.7}
        />
      </mesh>
      
      {/* North pole marker */}
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* South pole marker */}
      <mesh position={[0, -1.3, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

function Scene({ onIntroComplete, setCurrentPlanet, viewMode, setViewMode }) {
  // Calculate static positions for individual view mode - moved to top
  const radius = 9; // Increased base radius for more spacing
  const angleStep = (2 * Math.PI) / 7; // Changed to 7 to evenly distribute 7 planets
  const staticPlanetPositions = [
    [0, 0, 0], // Center Sun
    [radius * Math.cos(0), 0, radius * Math.sin(0)], // Mars
    [radius * Math.cos(angleStep), 0, radius * Math.sin(angleStep)], // Venus
    [(radius - 1) * Math.cos(2 * angleStep), 0, (radius - 1) * Math.sin(2 * angleStep)], // Mercury - closer
    [radius * Math.cos(3 * angleStep), 0, radius * Math.sin(3 * angleStep)], // Earth
    [(radius + 2) * Math.cos(4 * angleStep), 0, (radius + 2) * Math.sin(4 * angleStep)], // Jupiter - farther
    [(radius + 3) * Math.cos(5 * angleStep), 0, (radius + 3) * Math.sin(5 * angleStep)], // Saturn - farther
  ];

  const planetData = [
    { 
      texture: "/8k_sun.jpg", 
      name: "Sun",
      description: "The star at the center of our solar system. It's a nearly perfect sphere of hot plasma and provides the energy that sustains life on Earth.",
      distance: "Center of Solar System",
      diameter: "864,938 miles"
    },
    { 
      texture: "/8k_mars.jpg", 
      name: "Mars",
      description: "Known as the Red Planet due to iron oxide on its surface. Mars has the largest volcano and canyon in the solar system.",
      distance: "142 million miles from Sun",
      diameter: "4,212 miles"
    },
    { 
      texture: "/8k_venus_surface.jpg", 
      name: "Venus",
      description: "The hottest planet in our solar system with surface temperatures of 900°F. Venus rotates backwards compared to most planets.",
      distance: "67 million miles from Sun",
      diameter: "7,521 miles"
    },
    { 
      texture: "/8k_mercury.jpg", 
      name: "Mercury",
      description: "The smallest planet and closest to the Sun. Mercury has extreme temperature variations from -290°F to 800°F.",
      distance: "36 million miles from Sun",
      diameter: "3,032 miles"
    },
    { 
      texture: "/Earth_imgFinal0.jpg", 
      name: "Earth",
      description: "The third planet from the Sun and the only known planet to harbor life. Earth has a diverse climate and is 71% covered by water.",
      distance: "93 million miles from Sun",
      diameter: "7,918 miles"
    },
    { 
      texture: "/8k_jupiter.jpg", 
      name: "Jupiter",
      description: "The largest planet in our solar system. Jupiter is a gas giant with a Great Red Spot storm larger than Earth.",
      distance: "484 million miles from Sun",
      diameter: "86,881 miles"
    },
    { 
      texture: "/8k_saturn.jpg", 
      name: "Saturn",
      description: "Famous for its prominent ring system. Saturn is a gas giant and the least dense planet in our solar system.",
      distance: "886 million miles from Sun",
      diameter: "72,367 miles"
    },
  ];

  const [isAnimating, setIsAnimating] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [glowCenter, setGlowCenter] = useState(new THREE.Vector3(0, 0.8, 0.6));
  const [currentPlanetIndex, setCurrentPlanetIndex] = useState(0);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [cameraDistance, setCameraDistance] = useState(5);
  const [viewModeState, setViewModeState] = useState('individual');
  const [cameraMode, setCameraMode] = useState('normal');
  const [dynamicPlanetPositions, setDynamicPlanetPositions] = useState(staticPlanetPositions);
  const [eclipseMode, setEclipseMode] = useState(false);
  const orbitControlsRef = useRef();
  
  // Camera mode configurations
  const cameraModes = {
    normal: {
      fov: 60,
      distance: 5,
      position: (target, distance) => new THREE.Vector3(target[0], target[1], target[2] + distance),
      name: 'Normal View'
    },
    wide: {
      fov: 90,
      distance: 8,
      position: (target, distance) => new THREE.Vector3(target[0], target[1] + 2, target[2] + distance),
      name: 'Wide Angle'
    },
    telephoto: {
      fov: 30,
      distance: 12,
      position: (target, distance) => new THREE.Vector3(target[0], target[1], target[2] + distance),
      name: 'Telephoto'
    },
    cinematic: {
      fov: 45,
      distance: 7,
      position: (target, distance) => new THREE.Vector3(target[0] + 2, target[1] + 1, target[2] + distance - 2),
      name: 'Cinematic'
    },
    bird: {
      fov: 75,
      distance: 10,
      position: (target, distance) => new THREE.Vector3(target[0], target[1] + distance, target[2]),
      name: 'Bird\'s Eye'
    },
    close: {
      fov: 50,
      distance: 3,
      position: (target, distance) => new THREE.Vector3(target[0] + 1, target[1], target[2] + distance),
      name: 'Close-up'
    },
    overview: {
      fov: 75,
      distance: 35,
      position: (target, distance) => new THREE.Vector3(0, 8, distance),
      name: 'Solar System'
    },
    ein: {
      fov: 60,
      distance: 25,
      position: (target, distance) => new THREE.Vector3(5, 12, distance),
      name: 'Ein Overview'
    }
  };

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

  // Calculate dynamic orbital positions for planets around the Sun
  const getPlanetPosition = (planetIndex, time) => {
    if (planetIndex === 0) return [0, 0, 0]; // Sun stays at center
    
    // Orbital parameters for realistic motion with slower speeds and more gaps
    const orbitalData = [
      null, // Sun
      { radius: 10, speed: 0.3, tilt: 0.1 }, // Mars - increased gap and slower
      { radius: 7, speed: 0.2, tilt: 0.05 }, // Venus - slower
      { radius: 5.5, speed: 0.3, tilt: 0.02 }, // Mercury - slower
      { radius: 8.5, speed: 0.25, tilt: 0.0 }, // Earth - slower
      { radius: 14, speed: 0.10, tilt: 0.3 }, // Jupiter - much slower, bigger gap
      { radius: 18, speed: 0.17, tilt: 0.4 }, // Saturn - slower, bigger gap
    ];
    
    const planet = orbitalData[planetIndex];
    if (!planet) return [0, 0, 0];
    
    const angle = time * planet.speed;
    const x = Math.cos(angle) * planet.radius;
    const z = Math.sin(angle) * planet.radius;
    const y = Math.sin(angle * 0.1) * planet.tilt; // Slight vertical oscillation
    
    return [x, y, z];
  };

  useEffect(() => {
    const handleWheel = (event) => {
      if (viewModeState === 'overview') return;
      
      event.preventDefault();
      const delta = event.deltaY > 0 ? 1 : -1;
      setCurrentPlanetIndex((prev) => {
        const newIndex = (prev + delta + planetData.length) % planetData.length;
        setCurrentPlanet(planetData[newIndex].name);
        return newIndex;
      });
    };

    const handleKeyPress = (event) => {
      if (event.key === 'v' || event.key === 'V') {
        setViewModeState(prev => prev === 'individual' ? 'overview' : 'individual');
        setViewMode(prev => prev === 'individual' ? 'overview' : 'individual');
        setCameraMode(prev => prev === 'overview' ? 'normal' : 'overview');
      }
      
      // Camera mode cycling with 'C' key
      if (event.key === 'c' || event.key === 'C') {
        const modes = Object.keys(cameraModes);
        setCameraMode(prev => {
          const currentIndex = modes.indexOf(prev);
          const nextIndex = (currentIndex + 1) % modes.length;
          const newMode = modes[nextIndex];
          
          // Update view mode based on camera mode
          if (newMode === 'overview' || newMode === 'ein') {
            setViewModeState('overview');
            setViewMode('overview');
          } else {
            setViewModeState('individual');
            setViewMode('individual');
          }
          
          return newMode;
        });
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [planetData.length, setCurrentPlanet, viewModeState, setViewMode]);

  useFrame((state) => {
    // Update dynamic positions for overview mode
    if (viewModeState === 'overview') {
      const newPositions = planetData.map((_, index) => 
        getPlanetPosition(index, state.clock.elapsedTime)
      );
      setDynamicPlanetPositions(newPositions);
    }

    if (state.camera && orbitControlsRef.current) {
      const currentCameraMode = cameraModes[cameraMode];
      
      // Apply camera FOV
      state.camera.fov = currentCameraMode.fov;
      state.camera.updateProjectionMatrix();

      if (viewModeState === 'overview') {
        // Overview mode settings
        orbitControlsRef.current.target.set(0, 0, 0);
        setCameraDistance(currentCameraMode.distance);
        
        const targetPos = currentCameraMode.position([0, 0, 0], currentCameraMode.distance);
        state.camera.position.lerp(targetPos, 0.05);
        
      } else {
        // Individual planet mode
        let targetPosition = staticPlanetPositions[currentPlanetIndex];
        
        orbitControlsRef.current.target.set(
          targetPosition[0],
          targetPosition[1], 
          targetPosition[2]
        );
        
        if (!orbitControlsRef.current.enabled || 
            (Math.abs(state.camera.position.x - targetPosition[0]) > 0.1 ||
             Math.abs(state.camera.position.y - targetPosition[1]) > 0.1 ||
             Math.abs(state.camera.position.z - (targetPosition[2] + currentCameraMode.distance)) > 0.1)) {
          
          // Adjust distance based on planet type and camera mode
          const isMars = planetData[currentPlanetIndex].name === "Mars";
          const isJupiter = planetData[currentPlanetIndex].name === "Jupiter";
          let distance = currentCameraMode.distance;
          
          if (isMars) distance = Math.max(distance * 0.6, 2);
          if (isJupiter) distance = Math.max(distance * 0.8, 3);
          
          setCameraDistance(distance);
          
          const targetPos = currentCameraMode.position(targetPosition, distance);
          state.camera.position.lerp(targetPos, 0.05);
        }
      }
    }
  });

  return (
    <>
      <MilkyWay />
      <Stars />
      <ShootingStars />
      <ambientLight intensity={2.5} />
      <pointLight position={[10, 10, 10]} intensity={2} />
      
      {/* Planet Orbital Paths - only show in overview mode */}
      {planetData.map((planet, index) => (
        <PlanetOrbitPath 
          key={`orbit-${index}-${planet.name}`}
          planetIndex={index}
          viewModeState={viewModeState}
        />
      ))}
      
      {planetData.map((planet, index) => {
        // Calculate position based on view mode using stored positions
        const position = viewModeState === 'overview' 
          ? dynamicPlanetPositions[index]
          : staticPlanetPositions[index];
        
        return (
          <group key={`planet-${index}-${planet.name}`}>
            <EarthModel
              isAnimating={isAnimating}
              glowIntensity={glowIntensity}
              texturePath={planet.texture}
              position={position}
              planetInfo={planet}
              onHover={setHoveredPlanet}
              onHoverOut={() => setHoveredPlanet(null)}
              viewModeState={viewModeState}
              planetIndex={index}
            />
            
            {/* Planet Axis Indicator - only show in overview mode */}
            <PlanetAxis 
              position={position}
              planetIndex={index}
              planetInfo={planet}
              viewModeState={viewModeState}
            />
            
            {/* Planet Name Label */}
            <Html 
              position={[
                position[0],
                position[1] - 1.0,
                position[2]
              ]} 
              center
              distanceFactor={viewModeState === 'overview' ? 15 : 5} // Increased distance factor for overview
              occlude={true}
              transform
              sprite
              style={{ 
                pointerEvents: 'none'
              }}
            >
              <div style={{
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: viewModeState === 'overview' ? '8px' : '11px', // Smaller font for overview
                fontWeight: 'bold',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(8px)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                minWidth: viewModeState === 'overview' ? '40px' : '60px' // Smaller min width for overview
              }}>
                {planet.name}
              </div>
            </Html>
          </group>
        );
      })}
      
      {/* Moon orbiting Earth - update position dynamically */}
      <MoonOrbit 
        earthPosition={viewModeState === 'overview' 
          ? dynamicPlanetPositions[4]
          : staticPlanetPositions[4]} 
        onHover={setHoveredPlanet}
        onHoverOut={() => setHoveredPlanet(null)}
      />
      
      <SaturnRings position={viewModeState === 'overview' 
        ? dynamicPlanetPositions[6]
        : staticPlanetPositions[6]} />
      
      <OrbitControls 
        ref={orbitControlsRef}
        enableZoom={viewModeState === 'overview' || cameraMode === 'bird' || cameraMode === 'wide'} 
        enableRotate={true} 
        enablePan={viewModeState === 'overview'}
        minDistance={viewModeState === 'overview' ? 10 : 1}
        maxDistance={viewModeState === 'overview' ? 60 : 15}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={cameraMode === 'cinematic' ? 0.3 : 0.5}
        zoomSpeed={cameraMode === 'telephoto' ? 0.5 : 1.2}
        target={viewModeState === 'overview' ? [0, 0, 0] : staticPlanetPositions[currentPlanetIndex]}
      />
      
      {/* Camera Mode Instructions */}
      <Html position={[-10, 8, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '11px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          width: '220px',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: '6px' }}>
            <strong>Controls:</strong>
          </div>
          <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '4px' }}>
            Press 'V' to toggle view mode
          </div>
          <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '6px' }}>
            Press 'C' to cycle camera modes
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#66ccff', 
            fontWeight: 'bold',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            paddingTop: '6px'
          }}>
            {cameraModes[cameraMode].name}
          </div>
          <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>
            FOV: {cameraModes[cameraMode].fov}°
          </div>
          {viewModeState === 'individual' && (
            <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '4px' }}>
              Scroll to navigate planets
            </div>
          )}
        </div>
      </Html>

      {/* Camera Mode Indicator */}
      <Html position={[10, 8, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '10px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          minWidth: '100px',
          textAlign: 'center',
        }}>
          <div style={{ color: '#66ccff', fontWeight: 'bold' }}>
            Camera Mode
          </div>
          <div style={{ fontSize: '9px', opacity: 0.8 }}>
            {cameraModes[cameraMode].name}
          </div>
        </div>
      </Html>
    </>
  );
}

export default function Global() {
  const [introComplete, setIntroComplete] = useState(false);
  const [currentPlanet, setCurrentPlanet] = useState("Sun");
  const [viewMode, setViewMode] = useState('individual');

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
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </Canvas>
        
        {/* Planet indicator */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          background: 'rgba(0,0,0,0.8)',
          padding: '12px 20px',
          borderRadius: '10px',
          zIndex: 1000,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
          minWidth: '200px'
        }}>
          <div style={{ fontSize: '18px' }}>
            {viewMode === 'overview' ? 'Solar System View' : currentPlanet}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
            Press 'C' for camera modes • 'V' for view toggle
          </div>
        </div>
      </div>
    </section>
  );
}