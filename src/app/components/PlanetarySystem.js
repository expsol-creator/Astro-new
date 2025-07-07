"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { useTexture, shaderMaterial, Html } from "@react-three/drei";
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
  `
  varying vec2 vUv; 
  varying vec3 vPosition; 
  varying vec3 vNormal; 
  varying vec3 vViewPosition; 
  
  void main() { 
    vUv = uv; 
    vPosition = position; 
    vNormal = normal; 
    vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz; 
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
  }`,
  `
  uniform sampler2D map; 
  uniform vec3 glowCenter; 
  uniform float glowRadius; 
  uniform float glowIntensity; 
  uniform vec3 glowColor; 
  uniform float time; 
  uniform vec3 viewVector; 
  varying vec2 vUv; 
  varying vec3 vPosition; 
  varying vec3 vNormal; 
  varying vec3 vViewPosition; 
  
  void main() { 
    vec4 texColor = texture2D(map, vUv); 
    float dist = distance(vPosition, glowCenter); 
    float glowBase = smoothstep(glowRadius, 0.0, dist) * glowIntensity; 
    vec3 viewDir = normalize(vViewPosition); 
    float glowFactor = max(0.0, dot(vNormal, viewDir)) * 2.0; 
    float dynamicGlow = glowBase * (1.0 + sin(time * 3.0 + vPosition.y) * 0.3 + glowFactor); 
    vec3 finalColor = mix(texColor.rgb, glowColor, dynamicGlow * 0.5); 
    gl_FragColor = vec4(finalColor, 1.0); 
  }`
);

const SunMaterial = shaderMaterial(
  {
    map: null,
    time: 0,
    viewVector: new THREE.Vector3(),
    glowIntensity: 3.0,
    shadowIntensity: 0.3,
  },
  `
   varying vec2 vUv; 
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
  `
   uniform sampler2D map; 
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
     
     float frontGlow = pow(fresnel, 2.0) * glowIntensity;
     
     float backShadow = max(0.0, dot(vNormal, viewDir));
     backShadow = 1.0 - (backShadow * shadowIntensity);
     
     float surface = sin(time * 4.0 + vUv.x * 10.0) * 0.1 + 0.9;
     surface *= cos(time * 3.0 + vUv.y * 8.0) * 0.1 + 0.9;
     
     vec3 coronaColor = vec3(1.0, 0.6, 0.1);
     vec3 coreColor = vec3(1.0, 0.8, 0.3);
     
     vec3 sunColor = mix(coreColor, coronaColor, fresnel);
     sunColor *= surface;
     sunColor *= backShadow;
     
     vec3 glowColor = vec3(1.0, 0.5, 0.0);
     vec3 finalColor = sunColor + (glowColor * frontGlow * 0.5);
     
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
  `
   varying vec2 vUv; 
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
  `
   uniform sampler2D map; 
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
     
     vec3 lightDirection = normalize(sunPosition - vWorldPosition);
     
     float lightDot = max(0.0, dot(vNormal, lightDirection));
     
     float dayNightTransition = smoothstep(0.0, 0.3, lightDot);
     
     float atmosphereGlow = pow(1.0 - abs(dot(vNormal, lightDirection)), 2.0) * 0.2;
     
     float distance = length(sunPosition - planetPosition);
     float distanceFalloff = 1.0 / (1.0 + distance * 0.01);
     
     float finalLight = (ambientStrength + dayNightTransition * lightIntensity * distanceFalloff) + atmosphereGlow;
     
     vec3 warmTint = vec3(1.1, 1.0, 0.9);
     vec3 coolTint = vec3(0.8, 0.9, 1.2);
     vec3 colorTint = mix(coolTint, warmTint, dayNightTransition);
     
     vec3 finalColor = texColor.rgb * finalLight * colorTint;
     
     gl_FragColor = vec4(finalColor, texColor.a); 
   }`
);

extend({ GlowMaterial, SunMaterial, PlanetMaterial });

export function SaturnRings({ position }) {
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

// SSR-safe texture loading hook with performance optimizations
const useOptimizedTexture = (texturePath, priority = false) => {
  const [texture, setTexture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    if (!texturePath || typeof window === 'undefined') return;
    
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const loader = new THREE.TextureLoader();
    
    // Progressive texture path resolution
    const getTexturePaths = (originalPath) => {
      const paths = [originalPath];
      
      if (isMobile) {
        // Try 2k version first for mobile
        if (originalPath.includes('/8k_')) {
          paths.unshift(originalPath.replace('/8k_', '/2k_'));
        }
        if (originalPath.includes('/4k_')) {
          paths.unshift(originalPath.replace('/4k_', '/2k_'));
        }
      }
      
      return paths;
    };
    
    const loadTexture = async () => {
      const paths = getTexturePaths(texturePath);
      
      for (let i = 0; i < paths.length; i++) {
        try {
          const loadedTexture = await new Promise((resolve, reject) => {
            loader.load(paths[i], resolve, undefined, reject);
          });
          
          // Optimize texture settings for performance
          loadedTexture.generateMipmaps = !isMobile;
          loadedTexture.minFilter = isMobile ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
          loadedTexture.magFilter = THREE.LinearFilter;
          loadedTexture.wrapS = THREE.RepeatWrapping;
          loadedTexture.wrapT = THREE.RepeatWrapping;
          
          if (isMobile && loadedTexture.image) {
            loadedTexture.format = THREE.RGBFormat;
          }
          
          setTexture(loadedTexture);
          setIsLoading(false);
          setError(false);
          return;
        } catch (err) {
          console.warn(`Failed to load texture: ${paths[i]}`, err);
          if (i === paths.length - 1) {
            setError(true);
            setIsLoading(false);
          }
        }
      }
    };
    
    if (priority) {
      loadTexture();
    } else {
      // Stagger non-priority texture loading
      const delay = Math.random() * 1000 + 200; // 200-1200ms delay
      setTimeout(loadTexture, delay);
    }
    
    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [texturePath, priority]);
  
  return { texture, isLoading, error };
};

// SSR-safe planet data function - reorder to match actual solar system
const createPlanetData = () => [
  { 
    texture: "/8k_sun.jpg", 
    name: "Sun",
    description: "The star at the center of our solar system. It's a nearly perfect sphere of hot plasma and provides the energy that sustains life on Earth.",
    distance: "Center of Solar System",
    diameter: "864,938 miles",
    priority: true // Load first
  },
  { 
    texture: "/8k_mercury.jpg", 
    name: "Mercury",
    description: "The smallest planet and closest to the Sun. Mercury has extreme temperature variations from -290°F to 800°F.",
    distance: "36 million miles from Sun",
    diameter: "3,032 miles"
  },
  { 
    texture: "/8k_venus_surface.jpg", 
    name: "Venus",
    description: "The hottest planet in our solar system with surface temperatures of 900°F. Venus rotates backwards compared to most planets.",
    distance: "67 million miles from Sun",
    diameter: "7,521 miles"
  },
  { 
    texture: "/Earth_imgFinal0.jpg", 
    name: "Earth",
    description: "The third planet from the Sun and the only known planet to harbor life. Earth has a diverse climate and is 71% covered by water.",
    distance: "93 million miles from Sun",
    diameter: "7,918 miles",
    priority: true // Load second
  },
  { 
    texture: "/8k_mars.jpg", 
    name: "Mars",
    description: "Known as the Red Planet due to iron oxide on its surface. Mars has the largest volcano and canyon in the solar system.",
    distance: "142 million miles from Sun",
    diameter: "4,212 miles"
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

// SSR-safe hook to get planet data
export const usePlanetData = () => {
  const [planetData, setPlanetData] = useState([]);
  
  useEffect(() => {
    setPlanetData(createPlanetData());
  }, []);
  
  return planetData;
};

// Export planet data getter for SSR safety
export const planetData = typeof window !== 'undefined' ? createPlanetData() : [];

export function EarthModel({ isAnimating, glowCenter, glowIntensity, texturePath, position, planetInfo, onHover, onHoverOut, viewModeState, planetIndex, isMobile = false }) {
  const earthRef = useRef();
  const materialRef = useRef();
  const { texture, isLoading, error } = useOptimizedTexture(texturePath, planetInfo?.priority);

  // Memoize rotation speeds for performance
  const rotationSpeed = useMemo(() => {
    const rotationSpeeds = [
      isMobile ? 0.025 : 0.02, // Sun
      isMobile ? 0.035 : 0.03, // Mars
      isMobile ? -0.055 : -0.05, // Venus (retrograde)
      isMobile ? 0.065 : 0.06, // Mercury
      isMobile ? 0.045 : 0.04, // Earth
      isMobile ? 0.075 : 0.07, // Jupiter
      isMobile ? 0.065 : 0.06, // Saturn
    ];
    return rotationSpeeds[planetIndex] || 0.1;
  }, [planetIndex, isMobile]);

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * rotationSpeed;
      
      if (materialRef.current && texture) {
        materialRef.current.time = state.clock.elapsedTime;
        materialRef.current.sunPosition = new THREE.Vector3(0, 0, 0);
        materialRef.current.planetPosition = new THREE.Vector3(position[0], position[1], position[2]);
      }
    }
  });

  // Show optimized loading placeholder
  if (isLoading || error || !texture) {
    return (
      <mesh
        position={position}
        scale={isMobile ? 0.6 : 0.7}
        onPointerOver={() => onHover && onHover({...planetInfo, position})}
        onPointerOut={() => onHoverOut && onHoverOut()}
      >
        <sphereGeometry args={[1, isMobile ? 8 : 12, isMobile ? 8 : 12]} />
        <meshBasicMaterial 
          color={error ? 0xff4444 : 0x444444} 
          wireframe={isLoading} 
          transparent={true}
          opacity={0.6}
        />
      </mesh>
    );
  }

  // Enhanced Sun rendering with mobile optimization
  if (planetInfo?.name === "Sun") {
    return (
      <group position={position}>
        <mesh
          ref={earthRef}
          scale={isMobile ? 1.0 : 1.2}
          onPointerOver={() => onHover && onHover({...planetInfo, position})}
          onPointerOut={() => onHoverOut && onHoverOut()}
        >
          <sphereGeometry args={[1, isMobile ? 20 : 64, isMobile ? 20 : 64]} />
          <sunMaterial
            ref={materialRef}
            map={texture}
            time={0}
            viewVector={new THREE.Vector3()}
            glowIntensity={isMobile ? 3.0 : 4.0}
            shadowIntensity={0.2}
          />
        </mesh>
        
        {/* Mobile-optimized lighting */}
        <pointLight 
          position={[0, 0, 0]} 
          intensity={isMobile ? 4 : 6} 
          color={0xffaa00} 
          decay={1.5}
          distance={isMobile ? 35 : 50}
        />
        {!isMobile && (
          <pointLight 
            position={[0, 0, 0]} 
            intensity={3} 
            color={0xff6600} 
            decay={1}
            distance={30}
          />
        )}
        
        {/* Mobile-optimized corona effects */}
        <mesh scale={isMobile ? 1.4 : 1.8}>
          <sphereGeometry args={[1, isMobile ? 8 : 32, isMobile ? 8 : 32]} />
          <meshBasicMaterial
            color={0xffaa00}
            transparent={true}
            opacity={isMobile ? 0.05 : 0.1}
            side={THREE.BackSide}
          />
        </mesh>
        
        {!isMobile && (
          <mesh scale={2.2}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial
              color={0xff4400}
              transparent={true}
              opacity={0.04}
              side={THREE.BackSide}
            />
          </mesh>
        )}
      </group>
    );
  }

  return (
    <mesh
      ref={earthRef}
      scale={isMobile ? 0.65 : 0.8}
      position={position}
      onPointerOver={() => onHover && onHover({...planetInfo, position})}
      onPointerOut={() => onHoverOut && onHoverOut()}
    >
      <sphereGeometry args={[1, isMobile ? 16 : 32, isMobile ? 16 : 32]} />
      <planetMaterial
        ref={materialRef}
        map={texture}
        time={0}
        sunPosition={new THREE.Vector3(0, 0, 0)}
        planetPosition={new THREE.Vector3(position[0], position[1], position[2])}
        lightIntensity={isMobile ? 1.0 : 1.2}
        ambientStrength={0.25}
      />
    </mesh>
  );
}

export function MoonOrbit({ earthPosition, onHover, onHoverOut, isMobile = false }) {
  const moonRef = useRef();
  const materialRef = useRef();
  const orbitGroupRef = useRef();
  
  const { texture, isLoading } = useOptimizedTexture("/8k_moon.jpg", false);
  const moonOrbitRadius = isMobile ? 1.6 : 2;

  const moonInfo = useMemo(() => ({
    name: "Moon",
    description: "Earth's only natural satellite. The Moon influences Earth's tides and has been a subject of human exploration. Rules Cancer in astrology.",
    distance: "238,855 miles from Earth",
    diameter: "2,159 miles"
  }), []);

  useFrame((state, delta) => {
    if (orbitGroupRef.current && moonRef.current && earthPosition) {
      // Update the orbit group position to follow Earth
      orbitGroupRef.current.position.set(earthPosition[0], earthPosition[1], earthPosition[2]);
      
      // Rotate the orbit group to make Moon orbit around Earth
      const moonOrbitSpeed = 0.6; // Moon orbital speed around Earth
      orbitGroupRef.current.rotation.y += delta * moonOrbitSpeed;
      
      // Rotate Moon on its own axis (tidally locked but still rotating)
      moonRef.current.rotation.y += delta * moonOrbitSpeed; // Same as orbital period (tidally locked)
      
      if (materialRef.current && texture) {
        materialRef.current.time = state.clock.elapsedTime;
        materialRef.current.sunPosition = new THREE.Vector3(0, 0, 0);
        
        // Get Moon's world position for lighting calculations
        const moonWorldPosition = new THREE.Vector3();
        moonRef.current.getWorldPosition(moonWorldPosition);
        materialRef.current.planetPosition = moonWorldPosition;
      }
    }
  });

  // Don't render if Earth position is not available
  if (!earthPosition || earthPosition.length !== 3) {
    return null;
  }

  if (isLoading || !texture) {
    return (
      <group ref={orbitGroupRef}>
        <mesh 
          ref={moonRef} 
          position={[moonOrbitRadius, 0.3, 0]}
          scale={isMobile ? 0.15 : 0.2}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={0x666666} wireframe={true} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={orbitGroupRef}>
      <mesh 
        ref={moonRef} 
        position={[moonOrbitRadius, 0.3, 0]} // Position relative to Earth
        scale={isMobile ? 0.2 : 0.3}
        onPointerOver={() => {
          // Get world position for hover info
          const worldPosition = new THREE.Vector3();
          moonRef.current.getWorldPosition(worldPosition);
          const currentPosition = [worldPosition.x, worldPosition.y, worldPosition.z];
          onHover({...moonInfo, position: currentPosition});
        }}
        onPointerOut={() => onHoverOut()}
      >
        <sphereGeometry args={[1, isMobile ? 12 : 32, isMobile ? 12 : 32]} />
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
      
      {/* Optional: Add a subtle orbit path visualization */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[moonOrbitRadius - 0.02, moonOrbitRadius + 0.02, 64]} />
        <meshBasicMaterial
          color={0x888888}
          transparent={true}
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Calculate dynamic orbital positions for planets around the Sun - updated for correct planet order
export const getPlanetPosition = (planetIndex, time) => {
  if (planetIndex === 0) return [0, 0, 0]; // Sun stays at center
  
  // Orbital parameters for realistic motion with compacted spacing - updated order
  const orbitalData = [
    null, // Sun
    { radius: 3.5, speed: 0.4, tilt: 0.02 }, // Mercury - closest and fastest
    { radius: 4.5, speed: 0.3, tilt: 0.05 }, // Venus
    { radius: 5.5, speed: 0.25, tilt: 0.0 }, // Earth
    { radius: 6.5, speed: 0.2, tilt: 0.1 }, // Mars
    { radius: 8.5, speed: 0.12, tilt: 0.3 }, // Jupiter
    { radius: 10, speed: 0.08, tilt: 0.4 }, // Saturn
  ];
  
  const planet = orbitalData[planetIndex];
  if (!planet) return [0, 0, 0];
  
  const angle = time * planet.speed;
  const x = Math.cos(angle) * planet.radius;
  const z = Math.sin(angle) * planet.radius;
  const y = Math.sin(angle * 0.1) * planet.tilt; // Slight vertical oscillation
  
  return [x, y, z];
};

export function PlanetOrbitPath({ planetIndex, viewModeState }) {
  // Don't show orbit for the Sun or if not in overview mode
  if (planetIndex === 0 || viewModeState !== 'overview') {
    return null;
  }

  // Orbital radii matching the dynamic positions - updated order
  const orbitalRadii = [
    null, // Sun
    3.5, // Mercury
    4.5, // Venus
    5.5, // Earth
    6.5, // Mars
    8.5, // Jupiter
    10, // Saturn
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

export function PlanetAxis({ position, planetIndex, planetInfo, viewModeState }) {
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
