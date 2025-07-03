"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture, Html } from "@react-three/drei";
import * as THREE from "three";
import { 
  EarthModel, 
  MoonOrbit, 
  SaturnRings, 
  PlanetOrbitPath, 
  PlanetAxis, 
  planetData, 
  getPlanetPosition 
} from './PlanetarySystem';
import RahuKetuSimulation from './RahuKetuSimulation';

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
    const starCount = 8; // Increased count for more variety
    const positions = new Float32Array(starCount * 6);
    
    for (let i = 0; i < starCount; i++) {
      const i6 = i * 6;
      // Start from upper atmosphere positions for more realistic entry
      const startX = (Math.random() - 0.5) * 200;
      const startY = 80 + Math.random() * 40; // Start high in the sky
      const startZ = (Math.random() - 0.5) * 200;
      
      // Create realistic downward trajectory with slight horizontal movement
      const dirX = (Math.random() - 0.5) * 15; // Less horizontal spread
      const dirY = -25 - Math.random() * 15; // Stronger downward motion
      const dirZ = (Math.random() - 0.5) * 15;
      
      // Start point
      positions[i6] = startX;
      positions[i6 + 1] = startY;
      positions[i6 + 2] = startZ;
      
      // End point (creates the trail)
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
      
      // Realistic shooting star cycle - longer intervals like real meteors
      for (let i = 0; i < shootingStarPositions.length / 6; i++) {
        const i6 = i * 6;
        const cycleTime = time % 15; // 15 second cycle for more realistic timing
        const starDelay = i * 1.8; // Staggered timing between different meteors
        const effectiveTime = (cycleTime - starDelay + 15) % 15;
        
        if (effectiveTime < 4) { // Visible for 4 seconds - slow motion effect
          const progress = effectiveTime / 4;
          
          // Realistic physics - faster acceleration as it falls
          const acceleratedProgress = progress * progress; // Quadratic acceleration
          const speed = 8 + acceleratedProgress * 12; // Speed increases from 8 to 20
          
          // Calculate realistic trajectory
          const gravity = acceleratedProgress * 2; // Gravity effect
          
          // Head of the meteor
          positionAttribute.array[i6] = shootingStarPositions[i6] + acceleratedProgress * speed * Math.cos(i * 0.7);
          positionAttribute.array[i6 + 1] = shootingStarPositions[i6 + 1] - acceleratedProgress * speed - gravity * 5;
          positionAttribute.array[i6 + 2] = shootingStarPositions[i6 + 2] + acceleratedProgress * speed * Math.sin(i * 0.5);
          
          // Tail of the meteor (creates the streak effect)
          const tailOffset = 0.3; // Tail follows slightly behind
          const tailProgress = Math.max(0, acceleratedProgress - tailOffset);
          positionAttribute.array[i6 + 3] = shootingStarPositions[i6 + 3] + tailProgress * speed * Math.cos(i * 0.7);
          positionAttribute.array[i6 + 4] = shootingStarPositions[i6 + 4] - tailProgress * speed - gravity * 3;
          positionAttribute.array[i6 + 5] = shootingStarPositions[i6 + 5] + tailProgress * speed * Math.sin(i * 0.5);
          
        } else {
          // Hide shooting star when not active
          positionAttribute.array[i6] = 1000;
          positionAttribute.array[i6 + 1] = 1000;
          positionAttribute.array[i6 + 2] = 1000;
          positionAttribute.array[i6 + 3] = 1000;
          positionAttribute.array[i6 + 4] = 1000;
          positionAttribute.array[i6 + 5] = 1000;
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
        opacity={0.8}
        linewidth={2}
      />
    </line>
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
        opacity={0.6}
      />
    </mesh>
  );
}

function NebulaBackground() {
  const nebulaRef = useRef();
  const nebula2Ref = useRef();
  const nebula3Ref = useRef();
  const texture = useTexture("/3d-render-solar-system-background-with-colourful-nebula.jpg");

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    if (nebulaRef.current) {
      // Slow rotation and subtle movement for main nebula
      nebulaRef.current.rotation.y += delta * 0.0005;
      nebulaRef.current.rotation.z += delta * 0.0003;
      nebulaRef.current.position.x = Math.sin(time * 0.1) * 2;
      nebulaRef.current.position.y = Math.cos(time * 0.08) * 1.5;
    }
    
    if (nebula2Ref.current) {
      // Different rotation for variety
      nebula2Ref.current.rotation.y -= delta * 0.0004;
      nebula2Ref.current.rotation.x += delta * 0.0002;
      nebula2Ref.current.position.z = Math.sin(time * 0.05) * 3;
    }
    
    if (nebula3Ref.current) {
      // Third nebula with different motion
      nebula3Ref.current.rotation.z += delta * 0.0006;
      nebula3Ref.current.position.x = Math.cos(time * 0.07) * 2.5;
      nebula3Ref.current.position.y = Math.sin(time * 0.09) * 1.8;
    }
  });

  return (
    <group>
      {/* Main nebula in background */}
      <mesh 
        ref={nebulaRef} 
        position={[30, 15, -80]} 
        rotation={[0.3, 0.8, 0.2]}
        scale={[60, 40, 30]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial 
          map={texture} 
          transparent={true}
          opacity={0.7}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Second nebula positioned in different corner */}
      <mesh 
        ref={nebula2Ref} 
        position={[-45, -20, -90]} 
        rotation={[0.1, -0.5, 0.4]}
        scale={[45, 35, 25]}
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
      
      {/* Third nebula for more coverage */}
      <mesh 
        ref={nebula3Ref} 
        position={[20, -30, -70]} 
        rotation={[-0.2, 1.2, -0.3]}
        scale={[50, 30, 20]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial 
          map={texture} 
          transparent={true}
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Additional smaller nebula patches for realism */}
      <mesh 
        position={[-20, 25, -60]} 
        rotation={[0.5, -0.8, 0.1]}
        scale={[25, 20, 15]}
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
      
      <mesh 
        position={[40, -10, -85]} 
        rotation={[-0.3, 0.6, -0.2]}
        scale={[35, 25, 18]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial 
          map={texture} 
          transparent={true}
          opacity={0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function Scene({ onIntroComplete, setCurrentPlanet, viewMode, setViewMode }) {
  // Calculate static positions for individual view mode - compacted spacing
  const radius = 6; // Reduced from 9 to 6
  const angleStep = (2 * Math.PI) / 7;
  
  // Bird's eye view circular arrangement - increased spacing from sun
  const getBirdEyePositions = () => {
    const birdRadius = 7; // Increased from 4 to 7 for more space from sun
    const birdAngleStep = (2 * Math.PI) / 6; // 6 planets around the sun
    return [
      [0, 0, 0], // Center Sun
      [birdRadius * Math.cos(0), 0, birdRadius * Math.sin(0)], // Mars
      [birdRadius * Math.cos(birdAngleStep), 0, birdRadius * Math.sin(birdAngleStep)], // Venus
      [birdRadius * Math.cos(2 * birdAngleStep), 0, birdRadius * Math.sin(2 * birdAngleStep)], // Mercury
      [birdRadius * Math.cos(3 * birdAngleStep), 0, birdRadius * Math.sin(3 * birdAngleStep)], // Earth
      [birdRadius * Math.cos(4 * birdAngleStep), 0, birdRadius * Math.sin(4 * birdAngleStep)], // Jupiter
      [birdRadius * Math.cos(5 * birdAngleStep), 0, birdRadius * Math.sin(5 * birdAngleStep)], // Saturn
    ];
  };

  const staticPlanetPositions = [
    [0, 0, 0], // Center Sun
    [radius * Math.cos(0), 0, radius * Math.sin(0)], // Mars
    [radius * Math.cos(angleStep), 0, radius * Math.sin(angleStep)], // Venus
    [(radius - 1.5) * Math.cos(2 * angleStep), 0, (radius - 1.5) * Math.sin(2 * angleStep)], // Mercury - closer
    [radius * Math.cos(3 * angleStep), 0, radius * Math.sin(3 * angleStep)], // Earth
    [(radius + 1) * Math.cos(4 * angleStep), 0, (radius + 1) * Math.sin(4 * angleStep)], // Jupiter - slightly farther
    [(radius + 1.5) * Math.cos(5 * angleStep), 0, (radius + 1.5) * Math.sin(5 * angleStep)], // Saturn - slightly farther
  ];

  const [isAnimating, setIsAnimating] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [glowCenter, setGlowCenter] = useState(new THREE.Vector3(0, 0.8, 0.6));
  const [currentPlanetIndex, setCurrentPlanetIndex] = useState(0);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [cameraDistance, setCameraDistance] = useState(5);
  const [viewModeState, setViewModeState] = useState('overview'); // Changed default to overview
  const [cameraMode, setCameraMode] = useState('overview'); // Changed default to overview
  const [dynamicPlanetPositions, setDynamicPlanetPositions] = useState(staticPlanetPositions);
  const [showRahuKetu, setShowRahuKetu] = useState(false);
  const orbitControlsRef = useRef();
  
  // Camera mode configurations
  const cameraModes = {
    normal: {
      fov: 60,
      distance: 5,
      position: (target, distance) => new THREE.Vector3(target[0], target[1], target[2] + distance),
      name: 'Normal View'
    },
    bird: {
      fov: 85, // Increased FOV for better circular view
      distance: 16, // Increased from 12 to 16 to accommodate larger circle
      position: (target, distance) => new THREE.Vector3(0, distance, 0), // Directly above center
      name: 'Bird\'s Eye'
    },
    overview: {
      fov: 85, // Increased from 75 to 85 for wider view
      distance: 25, // Increased from 20 to 25 for better clearance
      position: (target, distance) => new THREE.Vector3(0, 10, distance), // Increased height from 6 to 10
      name: 'Solar System'
    },
    ein: {
      fov: 70, // Increased from 60 to 70
      distance: 22, // Increased from 18 to 22
      position: (target, distance) => new THREE.Vector3(6, 12, distance), // Adjusted positions for better view
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
            
            if (isMars) distance = Math.max(distance * 0.6, 2);
            if (isJupiter) distance = Math.max(distance * 0.8, 3);
            
            setCameraDistance(distance);
            
            const targetPos = currentCameraMode.position(targetPosition, distance);
            state.camera.position.lerp(targetPos, 0.05);
          }
        }
      }
    }
  });

  return (
    <>
      {!showRahuKetu && (
        <>
          <MilkyWay />
          <NebulaBackground />
          <Stars />
          <ShootingStars />
          <ambientLight intensity={2.5} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          
          {/* Planet Orbital Paths */}
          {planetData.map((planet, index) => (
            <PlanetOrbitPath 
              key={`orbit-${index}-${planet.name}`}
              planetIndex={index}
              viewModeState={viewModeState}
            />
          ))}
          
          {planetData.map((planet, index) => {
            let position;
            
            // Choose position based on view mode and camera mode
            if (viewModeState === 'overview') {
              position = dynamicPlanetPositions[index];
            } else if (cameraMode === 'bird') {
              position = getBirdEyePositions()[index];
            } else {
              position = staticPlanetPositions[index];
            }
            
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
                  viewModeState={cameraMode === 'bird' ? 'individual' : viewModeState}
                  planetIndex={index}
                />
                
                <PlanetAxis 
                  position={position}
                  planetIndex={index}
                  planetInfo={planet}
                  viewModeState={cameraMode === 'bird' ? 'individual' : viewModeState}
                />
                
                {/* Planet Name Label */}
                <Html 
                  position={[
                    position[0],
                    position[1] - 1.0,
                    position[2]
                  ]} 
                  center
                  distanceFactor={cameraMode === 'bird' ? 8 : (viewModeState === 'overview' ? 15 : 5)}
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
              </group>
            );
          })}
          
          {/* Moon orbiting Earth */}
          <MoonOrbit 
            earthPosition={viewModeState === 'overview' 
              ? dynamicPlanetPositions[4]
              : (cameraMode === 'bird' ? getBirdEyePositions()[4] : staticPlanetPositions[4])} 
            onHover={setHoveredPlanet}
            onHoverOut={() => setHoveredPlanet(null)}
          />
          
          <SaturnRings position={viewModeState === 'overview' 
            ? dynamicPlanetPositions[6]
            : (cameraMode === 'bird' ? getBirdEyePositions()[6] : staticPlanetPositions[6])} />
          
          <OrbitControls 
            ref={orbitControlsRef}
            enableZoom={viewModeState === 'overview' || cameraMode === 'bird' || cameraMode === 'wide'} 
            enableRotate={true} 
            enablePan={viewModeState === 'overview' || cameraMode === 'bird'}
            minDistance={cameraMode === 'bird' ? 12 : (viewModeState === 'overview' ? 12 : 1)} // Increased bird min distance from 8 to 12
            maxDistance={cameraMode === 'bird' ? 25 : (viewModeState === 'overview' ? 50 : 15)} // Increased bird max distance from 20 to 25
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={cameraMode === 'cinematic' ? 0.3 : 0.5}
            zoomSpeed={cameraMode === 'telephoto' ? 0.5 : 1.2}
            target={viewModeState === 'overview' || cameraMode === 'bird' ? [0, 0, 0] : staticPlanetPositions[currentPlanetIndex]}
          />
          
          {/* Planet Hover Information Display - Only show in individual view mode and not in bird's eye view */}
          {hoveredPlanet && viewModeState === 'individual' && cameraMode !== 'bird' && (
            <Html 
              position={[
                // Positioning for normal view only
                hoveredPlanet.position ? hoveredPlanet.position[0] + 3.0 : 0,
                hoveredPlanet.position ? hoveredPlanet.position[1] + 0.5 : 0,
                hoveredPlanet.position ? hoveredPlanet.position[2] : 0
              ]} 
              center
              distanceFactor={cameraModes[cameraMode].fov * 0.10}
              occlude={false}
              transform
              sprite
              style={{ pointerEvents: 'none' }}
            >
              <div style={{
                background: 'rgba(0, 0, 0, 0.95)',
                color: 'white',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '10px',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                maxWidth: '200px',
                minWidth: '160px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.9)',
                transform: `scale(${Math.min(0.9, Math.max(0.6, cameraModes[cameraMode].fov / 65))})`,
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  marginBottom: '6px',
                  color: '#66ccff',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                  paddingBottom: '4px'
                }}>
                  {hoveredPlanet.name}
                </div>
                <div style={{ 
                  fontSize: '9px', 
                  lineHeight: '1.3', 
                  marginBottom: '6px',
                  opacity: 0.95
                }}>
                  {hoveredPlanet.description}
                </div>
                <div style={{ 
                  fontSize: '8px', 
                  opacity: 0.8,
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  paddingTop: '4px',
                  marginTop: '6px'
                }}>
                  <div style={{ marginBottom: '2px' }}>
                    <strong>Distance:</strong> {hoveredPlanet.distance}
                  </div>
                  <div>
                    <strong>Diameter:</strong> {hoveredPlanet.diameter}
                  </div>
                </div>
              </div>
            </Html>
          )}
          
          {/* Camera Mode Instructions */}
          <Html position={[-10, 14, 0]} style={{ pointerEvents: 'none' }}>
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
              <div style={{ marginBottom: '4px' }}>
                <strong>Controls:</strong>
              </div>
              {!showRahuKetu && (
                <>
                  <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '4px' }}>
                    Press 'V' to toggle view mode
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '6px' }}>
                    Press 'C' to cycle camera modes
                  </div>
                </>
              )}
              <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '6px' }}>
                Press 'R' for Rahu-Ketu simulation
              </div>
              {!showRahuKetu && (
                <>
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
                </>
              )}
              {showRahuKetu && (
                <div style={{ 
                  fontSize: '11px', 
                  color: '#ffaa00', 
                  fontWeight: 'bold',
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  paddingTop: '6px'
                }}>
                  Rahu-Ketu Mode Active
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
      )}
      
      {/* Rahu-Ketu Simulation with exit functionality */}
      <RahuKetuSimulation isActive={showRahuKetu} onExit={handleExitRahuKetu} />
    </>
  );
}

export default function Global() {
  const [introComplete, setIntroComplete] = useState(false);
  const [currentPlanet, setCurrentPlanet] = useState("Sun");
  const [viewMode, setViewMode] = useState('overview'); // Changed default to overview

  return (
    <section
      className="relative flex items-center justify-center min-h-screen bg-black text-white"
    >
      <div
        className="w-full h-screen relative z-10 p-2"
      >
        <Canvas
          className="w-full h-screen"
          camera={{ position: [0, 10, 25], fov: 85 }} // Updated initial camera position and FOV for better overview
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
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
            Press 'C' for camera modes • 'V' for view toggle
          </div>
        </div>
      </div>
    </section>
  );
}