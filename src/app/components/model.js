"use client";

import { useRef, useState, useEffect, Suspense, lazy, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture, Html } from "@react-three/drei";
import * as THREE from "three";
import { 
  EarthModel, 
  MoonOrbit, 
  SaturnRings, 
  PlanetOrbitPath, 
  PlanetAxis, 
  usePlanetData,
  getPlanetPosition 
} from './PlanetarySystem';

// Lazy load heavy components
const RahuKetuSimulation = lazy(() => import('./RahuKetuSimulation'));

// Mobile detection utility
const isMobile = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  return false;
};

// Optimized Stars component
function Stars() {
  const starsRef = useRef();
  const [positions, setPositions] = useState(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    setIsMobileDevice(isMobile());
    const starCount = isMobile() ? 600 : 1200; // Further reduced for performance
    const starPositions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
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
          size: { value: isMobileDevice ? 1.2 : 1.8 },
        }}
        vertexShader={`
          uniform float time;
          uniform float size;
          
          void main() {
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            
            gl_Position = projectedPosition;
            gl_PointSize = size * (1.0 + sin(time * 2.0 + position.x * 0.01) * 0.4);
          }
        `}
        fragmentShader={`
          uniform float time;
          
          void main() {
            float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
            if (distanceToCenter > 0.5) discard;
            
            float alpha = 1.0 - distanceToCenter * 2.0;
            float twinkle = sin(time * 3.0 + gl_FragCoord.x * 0.1 + gl_FragCoord.y * 0.1) * 0.2 + 0.8;
            
            gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * twinkle);
          }
        `}
        transparent={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Progressive loading backgrounds
function MilkyWay() {
  const milkyWayRef = useRef();
  const [texture, setTexture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const loader = new THREE.TextureLoader();
      loader.load(
        "/8k_stars_milky_way.jpg",
        (loadedTexture) => {
          loadedTexture.minFilter = THREE.LinearFilter;
          setTexture(loadedTexture);
          setIsLoading(false);
        },
        undefined,
        (error) => {
          console.warn("Failed to load Milky Way texture:", error);
          setIsLoading(false);
        }
      );
    }, 3000); // Delay loading

    return () => clearTimeout(timer);
  }, []);

  useFrame((state, delta) => {
    if (milkyWayRef.current) {
      milkyWayRef.current.rotation.y += delta * 0.0008;
    }
  });

  if (isLoading || !texture) return null;

  return (
    <mesh ref={milkyWayRef} scale={[160, 160, 160]}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial 
        map={texture} 
        side={THREE.BackSide}
        transparent={true}
        opacity={0.4}
      />
    </mesh>
  );
}

function NebulaBackground() {
  const [texture, setTexture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const loader = new THREE.TextureLoader();
      loader.load(
        "/3d-render-solar-system-background-with-colourful-nebula.jpg",
        (loadedTexture) => {
          loadedTexture.minFilter = THREE.LinearFilter;
          setTexture(loadedTexture);
          setIsLoading(false);
        },
        undefined,
        (error) => {
          console.warn("Failed to load Nebula texture:", error);
          setIsLoading(false);
        }
      );
    }, 4000); // Further delayed

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !texture) return null;

  return (
    <group>
      <mesh 
        position={[25, 12, -60]} 
        rotation={[0.2, 0.6, 0.1]}
        scale={[40, 28, 20]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial 
          map={texture} 
          transparent={true}
          opacity={0.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      <mesh 
        position={[-30, -12, -70]} 
        rotation={[0.1, -0.4, 0.3]}
        scale={[35, 25, 18]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial 
          map={texture} 
          transparent={true}
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function Scene({ onIntroComplete, setCurrentPlanet, viewMode, setViewMode }) {
  const planetData = usePlanetData(); // Use SSR-safe hook
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadedComponents, setLoadedComponents] = useState(new Set());
  
  // Memoize positions for performance
  const staticPlanetPositions = useMemo(() => {
    const radius = 6;
    const angleStep = (2 * Math.PI) / 7;
    return [
      [0, 0, 0], // Center Sun
      [radius * Math.cos(0), 0, radius * Math.sin(0)], // Mars
      [radius * Math.cos(angleStep), 0, radius * Math.sin(angleStep)], // Venus
      [(radius - 1.5) * Math.cos(2 * angleStep), 0, (radius - 1.5) * Math.sin(2 * angleStep)], // Mercury
      [radius * Math.cos(3 * angleStep), 0, radius * Math.sin(3 * angleStep)], // Earth
      [(radius + 1) * Math.cos(4 * angleStep), 0, (radius + 1) * Math.sin(4 * angleStep)], // Jupiter
      [(radius + 1.5) * Math.cos(5 * angleStep), 0, (radius + 1.5) * Math.sin(5 * angleStep)], // Saturn
    ];
  }, []);

  const getBirdEyePositions = useMemo(() => () => {
    const birdRadius = 7;
    const birdAngleStep = (2 * Math.PI) / 6;
    return [
      [0, 0, 0], // Center Sun
      [birdRadius * Math.cos(0), 0, birdRadius * Math.sin(0)], // Mars
      [birdRadius * Math.cos(birdAngleStep), 0, birdRadius * Math.sin(birdAngleStep)], // Venus
      [birdRadius * Math.cos(2 * birdAngleStep), 0, birdRadius * Math.sin(2 * birdAngleStep)], // Mercury
      [birdRadius * Math.cos(3 * birdAngleStep), 0, birdRadius * Math.sin(3 * birdAngleStep)], // Earth
      [birdRadius * Math.cos(4 * birdAngleStep), 0, birdRadius * Math.sin(4 * birdAngleStep)], // Jupiter
      [birdRadius * Math.cos(5 * birdAngleStep), 0, birdRadius * Math.sin(5 * birdAngleStep)], // Saturn
    ];
  }, []);

  const [isAnimating, setIsAnimating] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [glowCenter, setGlowCenter] = useState(new THREE.Vector3(0, 0.8, 0.6));
  const [currentPlanetIndex, setCurrentPlanetIndex] = useState(0);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [cameraDistance, setCameraDistance] = useState(5);
  const [viewModeState, setViewModeState] = useState('overview');
  const [cameraMode, setCameraMode] = useState('overview');
  const [dynamicPlanetPositions, setDynamicPlanetPositions] = useState(staticPlanetPositions);
  const [showRahuKetu, setShowRahuKetu] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const orbitControlsRef = useRef();
  
  // Progressive loading timers
  useEffect(() => {
    const coreTimer = setTimeout(() => {
      setIsInitialLoading(false);
      setLoadedComponents(prev => new Set([...prev, 'core']));
    }, 800);

    const backgroundTimer = setTimeout(() => {
      setLoadedComponents(prev => new Set([...prev, 'background']));
    }, 2500);

    return () => {
      clearTimeout(coreTimer);
      clearTimeout(backgroundTimer);
    };
  }, []);

  // Detect mobile device
  useEffect(() => {
    setIsMobileDevice(isMobile());
    
    const handleResize = () => {
      setIsMobileDevice(isMobile());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Mobile-optimized camera mode configurations
  const cameraModes = {
    normal: {
      fov: isMobileDevice ? 90 : 80, // Wider FOV for mobile
      distance: isMobileDevice ? 4 : 5, // Closer distance for mobile
      position: (target, distance) => new THREE.Vector3(target[0], target[1], target[2] + distance),
      name: 'Normal View'
    },
    bird: {
      fov: isMobileDevice ? 100 : 85, // Much wider FOV for mobile
      distance: isMobileDevice ? 12 : 16, // Closer for mobile
      position: (target, distance) => new THREE.Vector3(0, distance, 0),
      name: 'Bird\'s Eye'
    },
    overview: {
      fov: isMobileDevice ? 100 : 85, // Wider FOV for mobile
      distance: isMobileDevice ? 20 : 25, // Closer for mobile
      position: (target, distance) => new THREE.Vector3(0, isMobileDevice ? 8 : 10, distance),
      name: 'Solar System'
    },
    ein: {
      fov: isMobileDevice ? 85 : 70, // Wider FOV for mobile
      distance: isMobileDevice ? 18 : 22, // Closer for mobile
      position: (target, distance) => new THREE.Vector3(6, isMobileDevice ? 10 : 12, distance),
      name: 'Ein Overview'
    }
  };

  const handleIntroComplete = () => {
    setTimeout(() => {
      setIsAnimating(false);
      onIntroComplete();
    }, 500);
  };

  const handleExitRahuKetu = () => {
    setShowRahuKetu(false);
  };

  useEffect(() => {
    setGlowIntensity(1.8);
    setGlowCenter(new THREE.Vector3(0, 0.8, 0.6));
    // Set initial view mode and camera mode to overview for better default view
    setViewMode('overview');
    handleIntroComplete();
  }, []);

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
      
      if (event.key === 'c' || event.key === 'C') {
        if (showRahuKetu) {
          // Let RahuKetuSimulation handle 'C' key when active
          return;
        }
        
        const modes = Object.keys(cameraModes);
        setCameraMode(prev => {
          const currentIndex = modes.indexOf(prev);
          const nextIndex = (currentIndex + 1) % modes.length;
          const newMode = modes[nextIndex];
          
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
      
      if (event.key === 'r' || event.key === 'R') {
        setShowRahuKetu(prev => !prev);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [planetData.length, setCurrentPlanet, viewModeState, setViewMode, showRahuKetu]);

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
      
      state.camera.fov = currentCameraMode.fov;
      state.camera.updateProjectionMatrix();

      if (viewModeState === 'overview') {
        orbitControlsRef.current.target.set(0, 0, 0);
        setCameraDistance(currentCameraMode.distance);
        
        const targetPos = currentCameraMode.position([0, 0, 0], currentCameraMode.distance);
        state.camera.position.lerp(targetPos, 0.05);
        
      } else {
        // Use bird's eye positions when in bird camera mode
        const positions = cameraMode === 'bird' ? getBirdEyePositions() : staticPlanetPositions;
        let targetPosition = positions[currentPlanetIndex];
        
        // For bird's eye view, always target the center when looking at individual planets
        if (cameraMode === 'bird') {
          orbitControlsRef.current.target.set(0, 0, 0);
          setCameraDistance(currentCameraMode.distance);
          
          const targetPos = currentCameraMode.position([0, 0, 0], currentCameraMode.distance);
          state.camera.position.lerp(targetPos, 0.05);
        } else {
          orbitControlsRef.current.target.set(
            targetPosition[0],
            targetPosition[1], 
            targetPosition[2]
          );
          
          if (!orbitControlsRef.current.enabled || 
              (Math.abs(state.camera.position.x - targetPosition[0]) > 0.1 ||
               Math.abs(state.camera.position.y - targetPosition[1]) > 0.1 ||
               Math.abs(state.camera.position.z - (targetPosition[2] + currentCameraMode.distance)) > 0.1)) {
            
            const isMars = planetData[currentPlanetIndex].name === "Mars";
            const isJupiter = planetData[currentPlanetIndex].name === "Jupiter";
            let distance = currentCameraMode.distance;
            
            // Special handling for Mars with mobile optimization
            if (isMars && cameraMode === 'normal') {
              distance = Math.max(distance * (isMobileDevice ? 0.6 : 0.7), isMobileDevice ? 2.0 : 2.5);
              // Adjust camera position for optimal Mars viewing angle
              const marsOptimalPos = new THREE.Vector3(
                targetPosition[0] + distance * (isMobileDevice ? 0.7 : 0.8),
                targetPosition[1] + distance * (isMobileDevice ? 0.6 : 0.8),
                targetPosition[2] + distance * 1.0
              );
              state.camera.position.lerp(marsOptimalPos, 0.05);
              setCameraDistance(distance);
            } else {
              if (isMars) distance = Math.max(distance * (isMobileDevice ? 0.5 : 0.6), isMobileDevice ? 1.5 : 2);
              if (isJupiter) distance = Math.max(distance * (isMobileDevice ? 0.7 : 0.8), isMobileDevice ? 2.5 : 3);
              
              setCameraDistance(distance);
              const targetPos = currentCameraMode.position(targetPosition, distance);
              state.camera.position.lerp(targetPos, 0.05);
            }
          }
        }
      }
    }
  });

  // Find Earth's index in planetData array
  const earthIndex = useMemo(() => {
    return planetData.findIndex(planet => planet.name === "Earth");
  }, [planetData]);

  return (
    <>
      {!showRahuKetu && (
        <>
          <Stars />
          <ambientLight intensity={isMobileDevice ? 1.6 : 2.2} />
          <pointLight position={[10, 10, 10]} intensity={isMobileDevice ? 1.0 : 1.8} />
          
          {/* Progressive background loading */}
          {loadedComponents.has('background') && !isMobileDevice && (
            <Suspense fallback={null}>
              <MilkyWay />
              <NebulaBackground />
            </Suspense>
          )}
          
          {/* Only render orbits when core is loaded */}
          {loadedComponents.has('core') && planetData.map((planet, index) => (
            <PlanetOrbitPath 
              key={`orbit-${index}-${planet.name}`}
              planetIndex={index}
              viewModeState={viewModeState}
            />
          ))}
          
          {planetData.map((planet, index) => {
            let position;
            
            if (viewModeState === 'overview') {
              position = dynamicPlanetPositions[index];
            } else if (cameraMode === 'bird') {
              position = getBirdEyePositions()[index];
            } else {
              position = staticPlanetPositions[index];
            }
            
            return (
              <group key={`planet-${index}-${planet.name}`}>
                <Suspense fallback={
                  <mesh position={position} scale={isMobileDevice ? 0.4 : 0.5}>
                    <sphereGeometry args={[1, 8, 8]} />
                    <meshBasicMaterial color={0x333333} wireframe={true} />
                  </mesh>
                }>
                  <EarthModel
                    isAnimating={isAnimating}
                    glowIntensity={glowIntensity}
                    texturePath={planet.texture}
                    position={position}
                    planetInfo={planet}
                    onHover={setHoveredPlanet}
                    onHoverOut={() => setHoveredPlanet(null)}
                    viewModeState={cameraMode === 'bird' ? 'individual' : viewModeState}
                    planetIndex={index}
                    isMobile={isMobileDevice}
                  />
                </Suspense>
                
                {/* Only show additional elements when loaded */}
                {loadedComponents.has('core') && (
                  <>
                    <PlanetAxis 
                      position={position}
                      planetIndex={index}
                      planetInfo={planet}
                      viewModeState={cameraMode === 'bird' ? 'individual' : viewModeState}
                    />
                    
                    <Html 
                      position={[position[0], position[1] - 1.0, position[2]]} 
                      center
                      distanceFactor={cameraMode === 'bird' ? 8 : (viewModeState === 'overview' ? 15 : 5)}
                      occlude={true}
                      transform
                      sprite
                      style={{ pointerEvents: 'none' }}
                    >
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: cameraMode === 'bird' ? '10px' : (viewModeState === 'overview' ? '8px' : '11px'),
                        fontWeight: 'bold',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(8px)',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                        minWidth: cameraMode === 'bird' ? '50px' : (viewModeState === 'overview' ? '40px' : '60px')
                      }}>
                        {planet.name}
                      </div>
                    </Html>
                  </>
                )}
              </group>
            );
          })}
          
          {/* Progressive loading of Moon and Saturn rings */}
          {loadedComponents.has('core') && earthIndex !== -1 && (
            <>
              <Suspense fallback={null}>
                <MoonOrbit 
                  earthPosition={viewModeState === 'overview' 
                    ? dynamicPlanetPositions[earthIndex]  // Use earthIndex instead of hardcoded 4
                    : (cameraMode === 'bird' ? getBirdEyePositions()[earthIndex] : staticPlanetPositions[earthIndex])} 
                  onHover={setHoveredPlanet}
                  onHoverOut={() => setHoveredPlanet(null)}
                  isMobile={isMobileDevice}
                />
              </Suspense>
              
              {/* Find Saturn's index for rings */}
              <SaturnRings position={viewModeState === 'overview' 
                ? dynamicPlanetPositions[planetData.findIndex(planet => planet.name === "Saturn")]
                : (cameraMode === 'bird' ? getBirdEyePositions()[planetData.findIndex(planet => planet.name === "Saturn")] : staticPlanetPositions[planetData.findIndex(planet => planet.name === "Saturn")])} />
            </>
          )}
          
          <OrbitControls 
            ref={orbitControlsRef}
            enableZoom={viewModeState === 'overview' || cameraMode === 'bird' || cameraMode === 'wide'} 
            enableRotate={true} 
            enablePan={viewModeState === 'overview' || cameraMode === 'bird'}
            minDistance={cameraMode === 'bird' ? (isMobileDevice ? 10 : 12) : (viewModeState === 'overview' ? (isMobileDevice ? 10 : 12) : 1)}
            maxDistance={cameraMode === 'bird' ? (isMobileDevice ? 20 : 25) : (viewModeState === 'overview' ? (isMobileDevice ? 40 : 50) : (isMobileDevice ? 12 : 15))}
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={isMobileDevice ? 0.8 : (cameraMode === 'cinematic' ? 0.3 : 0.5)}
            zoomSpeed={isMobileDevice ? 1.5 : (cameraMode === 'telephoto' ? 0.5 : 1.2)}
            target={viewModeState === 'overview' || cameraMode === 'bird' ? [0, 0, 0] : staticPlanetPositions[currentPlanetIndex]}
          />
          
          {/* Mobile-optimized hover information */}
          {hoveredPlanet && viewModeState === 'individual' && cameraMode !== 'bird' && (
            <Html 
              position={[
                hoveredPlanet.position ? hoveredPlanet.position[0] + (isMobileDevice ? 2.0 : 3.0) : 0,
                hoveredPlanet.position ? hoveredPlanet.position[1] + (isMobileDevice ? 0.3 : 0.5) : 0,
                hoveredPlanet.position ? hoveredPlanet.position[2] : 0
              ]} 
              center
              distanceFactor={cameraModes[cameraMode].fov * (isMobileDevice ? 0.08 : 0.10)}
              occlude={false}
              transform
              sprite
              style={{ pointerEvents: 'none' }}
            >
              <div style={{
                background: 'rgba(0, 0, 0, 0.95)',
                color: 'white',
                padding: isMobileDevice ? '8px 10px' : '10px 14px',
                borderRadius: '8px',
                fontSize: isMobileDevice ? '8px' : '10px',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                maxWidth: isMobileDevice ? '150px' : '200px',
                minWidth: isMobileDevice ? '120px' : '160px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.9)',
                transform: `scale(${isMobileDevice ? 0.8 : Math.min(0.9, Math.max(0.6, cameraModes[cameraMode].fov / 65))})`,
              }}>
                <div style={{ 
                  fontSize: isMobileDevice ? '10px' : '12px', 
                  fontWeight: 'bold', 
                  marginBottom: '4px',
                  color: '#66ccff',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                  paddingBottom: '2px'
                }}>
                  {hoveredPlanet.name}
                </div>
                <div style={{ 
                  fontSize: isMobileDevice ? '7px' : '9px', 
                  lineHeight: '1.2', 
                  marginBottom: '4px',
                  opacity: 0.95
                }}>
                  {isMobileDevice ? hoveredPlanet.description.substring(0, 80) + '...' : hoveredPlanet.description}
                </div>
                <div style={{ 
                  fontSize: isMobileDevice ? '6px' : '8px', 
                  opacity: 0.8,
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  paddingTop: '2px',
                  marginTop: '4px'
                }}>
                  <div style={{ marginBottom: '1px' }}>
                    <strong>Distance:</strong> {hoveredPlanet.distance}
                  </div>
                  <div>
                    <strong>Diameter:</strong> {hoveredPlanet.diameter}
                  </div>
                </div>
              </div>
            </Html>
          )}
          
          {/* Mobile-optimized Camera Mode Instructions */}
          <Html position={[isMobileDevice ? -8 : -10, isMobileDevice ? 10 : 14, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: isMobileDevice ? '6px 8px' : '8px 12px',
              borderRadius: '8px',
              fontSize: isMobileDevice ? '9px' : '11px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              width: isMobileDevice ? '160px' : '220px',
              textAlign: 'center',
            }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Controls:</strong>
              </div>
              {!showRahuKetu && (
                <>
                  <div style={{ fontSize: isMobileDevice ? '8px' : '10px', opacity: 0.9, marginBottom: '4px' }}>
                    {isMobileDevice ? 'Tap V: Toggle view' : 'Press \'V\' to toggle view mode'}
                  </div>
                  <div style={{ fontSize: isMobileDevice ? '8px' : '10px', opacity: 0.9, marginBottom: '6px' }}>
                    {isMobileDevice ? 'Tap C: Camera modes' : 'Press \'C\' to cycle camera modes'}
                  </div>
                </>
              )}
              <div style={{ fontSize: isMobileDevice ? '8px' : '10px', opacity: 0.9, marginBottom: '6px' }}>
                {isMobileDevice ? 'Tap R: Rahu-Ketu' : 'Press \'R\' for Rahu-Ketu simulation'}
              </div>
              {!showRahuKetu && (
                <>
                  <div style={{ 
                    fontSize: isMobileDevice ? '10px' : '12px', 
                    color: '#66ccff', 
                    fontWeight: 'bold',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    paddingTop: '4px'
                  }}>
                    {cameraModes[cameraMode].name}
                  </div>
                  <div style={{ fontSize: isMobileDevice ? '7px' : '9px', opacity: 0.7, marginTop: '2px' }}>
                    FOV: {cameraModes[cameraMode].fov}°
                  </div>
                </>
              )}
              {showRahuKetu && (
                <div style={{ 
                  fontSize: isMobileDevice ? '9px' : '11px', 
                  color: '#ffaa00', 
                  fontWeight: 'bold',
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  paddingTop: '4px'
                }}>
                  Rahu-Ketu Mode Active
                </div>
              )}
            </div>
          </Html>

          {/* Mobile-optimized Camera Mode Indicator */}
          <Html position={[isMobileDevice ? 8 : 10, isMobileDevice ? 6 : 8, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: isMobileDevice ? '4px 6px' : '6px 10px',
              borderRadius: '6px',
              fontSize: isMobileDevice ? '8px' : '10px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              minWidth: isMobileDevice ? '80px' : '100px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#66ccff', fontWeight: 'bold' }}>
                {isMobileDevice ? 'Camera' : 'Camera Mode'}
              </div>
              <div style={{ fontSize: isMobileDevice ? '7px' : '9px', opacity: 0.8 }}>
                {isMobileDevice ? cameraModes[cameraMode].name.split(' ')[0] : cameraModes[cameraMode].name}
              </div>
            </div>
          </Html>
        </>
      )}
      
      {/* Lazy load Rahu-Ketu Simulation */}
      {showRahuKetu && (
        <Suspense fallback={
          <Html center>
            <div style={{
              color: 'white',
              fontSize: '16px',
              textAlign: 'center',
              background: 'rgba(0,0,0,0.8)',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #ffaa00'
            }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              Loading Rahu-Ketu Simulation...
            </div>
          </Html>
        }>
          <RahuKetuSimulation isActive={showRahuKetu} onExit={() => setShowRahuKetu(false)} isMobile={isMobileDevice} />
        </Suspense>
      )}
    </>
  );
}

export default function Global() {
  const [introComplete, setIntroComplete] = useState(false);
  const [currentPlanet, setCurrentPlanet] = useState("Sun");
  const [viewMode, setViewMode] = useState('overview');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsMobileDevice(isMobile());
    
    // Preload critical resources
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = '/8k_sun.jpg';
      link.as = 'image';
      document.head.appendChild(link);
    }
  }, []);

  // Prevent SSR rendering
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
          <p className="text-xl mb-2">Initializing Solar System...</p>
          <p className="text-sm opacity-70">Preparing 3D environment</p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative flex items-center justify-center min-h-screen bg-black text-white">
      <div className="w-full h-screen relative z-10 p-2">
        <Canvas
          className="w-full h-screen"
          camera={{ 
            position: [0, isMobileDevice ? 8 : 10, isMobileDevice ? 20 : 25], 
            fov: isMobileDevice ? 100 : 85 
          }}
          gl={{ 
            antialias: !isMobileDevice,
            powerPreference: isMobileDevice ? "low-power" : "high-performance",
            alpha: false,
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
          }}
          dpr={isMobileDevice ? [1, 1.5] : [1, 2]}
          performance={{ min: 0.4 }}
        >
          <Scene 
            onIntroComplete={() => setIntroComplete(true)} 
            setCurrentPlanet={setCurrentPlanet}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </Canvas>
        
        {/* Mobile-optimized Planet indicator */}
        <div style={{
          position: 'fixed',
          bottom: isMobileDevice ? '10px' : '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: isMobileDevice ? '14px' : '16px',
          fontWeight: 'bold',
          background: 'rgba(0,0,0,0.8)',
          padding: isMobileDevice ? '8px 15px' : '12px 20px',
          borderRadius: '10px',
          zIndex: 1000,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
          minWidth: isMobileDevice ? '150px' : '200px',
          maxWidth: isMobileDevice ? '90vw' : 'none'
        }}>
          <div style={{ fontSize: isMobileDevice ? '16px' : '18px' }}>
            {viewMode === 'overview' ? 'Solar System View' : currentPlanet}
          </div>
          <div style={{ fontSize: isMobileDevice ? '10px' : '12px', opacity: 0.7, marginTop: '4px' }}>
            {isMobileDevice ? 'Tap C: Camera • V: View' : 'Press \'C\' for camera modes • \'V\' for view toggle'}
          </div>
        </div>
      </div>
    </section>
  );
}