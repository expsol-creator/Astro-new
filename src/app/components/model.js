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
        const cycleTime = time % 3;; // 5 second cycle
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

function EarthModel({ isAnimating, glowCenter, glowIntensity, texturePath, position, planetInfo, onHover, onHoverOut }) {
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
      onPointerOver={() => onHover(planetInfo)}
      onPointerOut={() => onHoverOut()}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <glowMaterial
        ref={materialRef}
        map={texture}
        glowCenter={glowCenter}
        glowRadius={0.4}
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
        materialRef.current.viewVector = state.camera.position.clone().normalize();
        materialRef.current.time = state.clock.elapsedTime;
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
      <glowMaterial
        ref={materialRef}
        map={texture}
        glowCenter={new THREE.Vector3(0, 0, 0)}
        glowRadius={0.4}
        glowIntensity={0.8}
        glowColor={new THREE.Color(0xaaaaaa)}
        time={0}
        viewVector={new THREE.Vector3()}
      />
    </mesh>
  );
}

function Scene({ onIntroComplete, setCurrentPlanet }) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [glowCenter, setGlowCenter] = useState(new THREE.Vector3(0, 0.8, 0.6));
  const [currentPlanetIndex, setCurrentPlanetIndex] = useState(0);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
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

  // Calculate circular positions for 12 zodiac planets plus Earth at center
  const radius = 7;
  const angleStep = (2 * Math.PI) / 12;
  const planetPositions = [
    [0, 0, 0], // Center Earth
    [radius * Math.cos(0), 0, radius * Math.sin(0)], // Mars (Aries)
    [radius * Math.cos(angleStep), 0, radius * Math.sin(angleStep)], // Venus (Taurus)
    [radius * Math.cos(2 * angleStep), 0, radius * Math.sin(2 * angleStep)], // Mercury (Gemini)
    [radius * Math.cos(3 * angleStep), 0, radius * Math.sin(3 * angleStep)], // Moon (Cancer)
    [radius * Math.cos(4 * angleStep), 0, radius * Math.sin(4 * angleStep)], // Sun (Leo)
    [radius * Math.cos(5 * angleStep), 0, radius * Math.sin(5 * angleStep)], // Mercury (Virgo)
    [radius * Math.cos(6 * angleStep), 0, radius * Math.sin(6 * angleStep)], // Venus (Libra)
    [radius * Math.cos(7 * angleStep), 0, radius * Math.sin(7 * angleStep)], // Mars (Scorpio)
    [radius * Math.cos(8 * angleStep), 0, radius * Math.sin(8 * angleStep)], // Jupiter (Sagittarius)
    [radius * Math.cos(9 * angleStep), 0, radius * Math.sin(9 * angleStep)], // Saturn (Capricorn)
    [radius * Math.cos(10 * angleStep), 0, radius * Math.sin(10 * angleStep)], // Uranus (Aquarius)
    [radius * Math.cos(11 * angleStep), 0, radius * Math.sin(11 * angleStep)], // Neptune (Pisces)
  ];

  const planetData = [
    { 
      texture: "/Earth_imgFinal0.jpg", 
      name: "Earth",
      description: "The third planet from the Sun and the only known planet to harbor life. Earth has a diverse climate and is 71% covered by water.",
      distance: "93 million miles from Sun",
      diameter: "7,918 miles"
    },
    { 
      texture: "/8k_mars.jpg", 
      name: "Mars",
      description: "Known as the Red Planet due to iron oxide on its surface. Mars has the largest volcano and canyon in the solar system. Rules Aries.",
      distance: "142 million miles from Sun",
      diameter: "4,212 miles"
    },
    { 
      texture: "/8k_venus_surface.jpg", 
      name: "Venus",
      description: "The hottest planet in our solar system with surface temperatures of 900°F. Venus rotates backwards compared to most planets. Rules Taurus.",
      distance: "67 million miles from Sun",
      diameter: "7,521 miles"
    },
    { 
      texture: "/8k_mercury.jpg", 
      name: "Mercury",
      description: "The smallest planet and closest to the Sun. Mercury has extreme temperature variations from -290°F to 800°F. Rules Gemini.",
      distance: "36 million miles from Sun",
      diameter: "3,032 miles"
    },
    { 
      texture: "/8k_sun.jpg", 
      name: "Sun",
      description: "The star at the center of our solar system. It's a nearly perfect sphere of hot plasma and provides the energy that sustains life on Earth. Rules Leo.",
      distance: "Center of Solar System",
      diameter: "864,938 miles"
    },
    { 
      texture: "/8k_mercury.jpg", 
      name: "Mercury",
      description: "The smallest planet and closest to the Sun. Mercury has extreme temperature variations from -290°F to 800°F. Rules Virgo.",
      distance: "36 million miles from Sun",
      diameter: "3,032 miles"
    },
    { 
      texture: "/8k_venus_surface.jpg", 
      name: "Venus",
      description: "The hottest planet in our solar system with surface temperatures of 900°F. Venus rotates backwards compared to most planets. Rules Libra.",
      distance: "67 million miles from Sun",
      diameter: "7,521 miles"
    },
    { 
      texture: "/8k_mars.jpg", 
      name: "Mars",
      description: "Known as the Red Planet due to iron oxide on its surface. Mars has the largest volcano and canyon in the solar system. Rules Scorpio.",
      distance: "142 million miles from Sun",
      diameter: "4,212 miles"
    },
    { 
      texture: "/8k_jupiter.jpg", 
      name: "Jupiter",
      description: "The largest planet in our solar system. Jupiter is a gas giant with a Great Red Spot storm larger than Earth. Rules Sagittarius.",
      distance: "484 million miles from Sun",
      diameter: "86,881 miles"
    },
    { 
      texture: "/8k_saturn.jpg", 
      name: "Saturn",
      description: "Famous for its prominent ring system. Saturn is a gas giant and the least dense planet in our solar system. Rules Capricorn.",
      distance: "886 million miles from Sun",
      diameter: "72,367 miles"
    },
    { 
      texture: "/2k_uranus.jpg", 
      name: "Uranus",
      description: "An ice giant that rotates on its side. Uranus has a faint ring system and 27 known moons. Rules Aquarius.",
      distance: "1.8 billion miles from Sun",
      diameter: "31,518 miles"
    },
    { 
      texture: "/2k_neptune.jpg", 
      name: "Neptune",
      description: "The windiest planet with speeds up to 1,200 mph. Neptune is an ice giant with a deep blue color. Rules Pisces.",
      distance: "2.8 billion miles from Sun",
      diameter: "30,775 miles"
    },
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
        
        // Adjust camera distance for Mars to give more space
        const isMars = planetData[currentPlanetIndex].name === "Mars";
        const cameraDistance = isMars ? 8 : 5;
        
        state.camera.position.lerp(
          new THREE.Vector3(
            targetPosition[0],
            targetPosition[1],
            targetPosition[2] + cameraDistance
          ),
          0.05
        );
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
      
      {/* Moon orbiting Earth */}
      <MoonOrbit 
        earthPosition={planetPositions[0]} 
        onHover={setHoveredPlanet}
        onHoverOut={() => setHoveredPlanet(null)}
      />
      
      {planetData.map((planet, index) => (
        <group key={index}>
          <EarthModel
            isAnimating={isAnimating}
            glowIntensity={glowIntensity}
            texturePath={planet.texture}
            position={planetPositions[index]}
            planetInfo={planet}
            onHover={setHoveredPlanet}
            onHoverOut={() => setHoveredPlanet(null)}
          />
          
          {/* Planet Name Label */}
          <Html 
            position={[
              planetPositions[index][0],
              planetPositions[index][1] - 1.0,
              planetPositions[index][2]
            ]} 
            center
            distanceFactor={5}
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
              fontSize: '11px',
              fontWeight: 'bold',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(8px)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              minWidth: '60px'
            }}>
              {planet.name}
            </div>
          </Html>
        </group>
      ))}
      
      <SaturnRings position={planetPositions[9]} />
      
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
      
      {/* Planet Description Tooltip */}
      {hoveredPlanet && (
        <Html 
          position={
            hoveredPlanet.name === "Moon" 
              ? [planetPositions[0][0], planetPositions[0][1] - 2, planetPositions[0][2]]
              : [
                  planetPositions[planetData.findIndex(p => p.name === hoveredPlanet.name)][0],
                  planetPositions[planetData.findIndex(p => p.name === hoveredPlanet.name)][1] - 2,
                  planetPositions[planetData.findIndex(p => p.name === hoveredPlanet.name)][2]
                ]
          } 
          distanceFactor={8}
          occlude={false}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '12px',
            borderRadius: '10px',
            width: '180px',
            height: '180px',
            fontSize: '11px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            transform: 'translate(-50%, -50%)'
          }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              color: '#66ccff', 
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {hoveredPlanet.name}
            </h3>
            <p style={{ 
              margin: '0 0 10px 0', 
              lineHeight: '1.2',
              fontSize: '10px',
              textAlign: 'justify',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical'
            }}>
              {hoveredPlanet.description}
            </p>
            <div style={{ 
              fontSize: '9px', 
              color: '#ccc',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              paddingTop: '6px',
              marginTop: '6px',
              width: '100%'
            }}>
              <div style={{ marginBottom: '3px' }}>
                <strong>Distance:</strong> {hoveredPlanet.distance}
              </div>
              <div>
                <strong>Diameter:</strong> {hoveredPlanet.diameter}
              </div>
            </div>
          </div>
        </Html>
      )}
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