"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";

function RahuKetuSimulation({ isActive, onExit, isMobile = false }) {
  const moonRef = useRef();
  const moonOrbitRef = useRef();
  const rahuKetuAxisRef = useRef();
  const eclipticPlaneRef = useRef();
  const [currentTime, setCurrentTime] = useState(0);
  const [cameraView, setCameraView] = useState('perspective'); // 'topDown', 'perspective', 'sideProfile'
  
  // Mobile-optimized orbital parameters
  const earthRadius = 1;
  const moonOrbitRadius = isMobile ? 6 : 8; // Smaller orbit for mobile
  const moonSize = isMobile ? 0.25 : 0.3; // Smaller moon for mobile
  const eclipticRadius = isMobile ? 10 : 12; // Smaller ecliptic for mobile
  const orbitalInclination = 5.14 * (Math.PI / 180); // 5.14 degrees in radians
  
  // Calculate lunar nodes positions
  const calculateNodalPositions = (time) => {
    // Nodes precess westward with a period of about 18.6 years
    // For simulation, we'll use a faster rate
    const nodalPrecessionRate = 0.02; // Adjust for visible movement
    const nodalAngle = time * nodalPrecessionRate;
    
    const rahuPosition = {
      x: Math.cos(nodalAngle) * moonOrbitRadius,
      y: 0, // Nodes are always on the ecliptic plane
      z: Math.sin(nodalAngle) * moonOrbitRadius
    };
    
    const ketuPosition = {
      x: -rahuPosition.x,
      y: 0,
      z: -rahuPosition.z
    };
    
    return { rahu: rahuPosition, ketu: ketuPosition, nodalAngle };
  };
  
  // Calculate Moon position with proper inclination
  const calculateMoonPosition = (time, nodalAngle) => {
    const moonOrbitRate = 0.5; // Moon orbital speed
    const moonAngle = time * moonOrbitRate;
    
    // Base position in orbital plane
    const x = Math.cos(moonAngle) * moonOrbitRadius;
    const z = Math.sin(moonAngle) * moonOrbitRadius;
    
    // Apply orbital inclination relative to the nodal line
    const relativeAngle = moonAngle - nodalAngle;
    const y = Math.sin(relativeAngle) * moonOrbitRadius * Math.sin(orbitalInclination);
    
    return { x, y, z };
  };
  
  useFrame((state, delta) => {
    if (!isActive) return;
    
    const time = state.clock.elapsedTime;
    setCurrentTime(time);
    
    const { rahu, ketu, nodalAngle } = calculateNodalPositions(time);
    const moonPosition = calculateMoonPosition(time, nodalAngle);
    
    // Update Moon position
    if (moonRef.current) {
      moonRef.current.position.set(moonPosition.x, moonPosition.y, moonPosition.z);
    }
    
    // Update Moon orbit visualization
    if (moonOrbitRef.current) {
      const orbitGeometry = moonOrbitRef.current.geometry;
      const positions = orbitGeometry.attributes.position.array;
      
      for (let i = 0; i < 360; i++) {
        const angle = (i * Math.PI) / 180;
        const relativeAngle = angle - nodalAngle;
        
        const x = Math.cos(angle) * moonOrbitRadius;
        const z = Math.sin(angle) * moonOrbitRadius;
        const y = Math.sin(relativeAngle) * moonOrbitRadius * Math.sin(orbitalInclination);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      
      orbitGeometry.attributes.position.needsUpdate = true;
    }
    
    // Update Rahu-Ketu axis
    if (rahuKetuAxisRef.current) {
      const axisGeometry = rahuKetuAxisRef.current.geometry;
      const positions = axisGeometry.attributes.position.array;
      
      // Rahu position
      positions[0] = rahu.x;
      positions[1] = rahu.y;
      positions[2] = rahu.z;
      
      // Ketu position
      positions[3] = ketu.x;
      positions[4] = ketu.y;
      positions[5] = ketu.z;
      
      axisGeometry.attributes.position.needsUpdate = true;
    }
  });
  
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyPress = (event) => {
      if (event.key === 'c' || event.key === 'C') {
        setCameraView(prev => {
          switch (prev) {
            case 'topDown': return 'perspective';
            case 'perspective': return 'sideProfile';
            case 'sideProfile': return 'topDown';
            default: return 'topDown';
          }
        });
      }
      
      // Add exit functionality with keyboard
      if (event.key === 'Escape' || event.key === 'r' || event.key === 'R') {
        onExit && onExit();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, onExit]);
  
  // Mobile-optimized camera positioning
  useFrame((state) => {
    if (!isActive) return;
    
    const camera = state.camera;
    const targetPosition = new THREE.Vector3();
    
    switch (cameraView) {
      case 'topDown':
        targetPosition.set(0, isMobile ? 20 : 25, 0);
        camera.position.lerp(targetPosition, 0.05);
        camera.lookAt(0, 0, 0);
        break;
      case 'sideProfile':
        targetPosition.set(isMobile ? 20 : 25, 0, 0);
        camera.position.lerp(targetPosition, 0.05);
        camera.lookAt(0, 0, 0);
        break;
      case 'perspective':
      default:
        targetPosition.set(isMobile ? 15 : 20, isMobile ? 12 : 15, isMobile ? 15 : 20);
        camera.position.lerp(targetPosition, 0.05);
        camera.lookAt(0, 0, 0);
        break;
    }
  });
  
  if (!isActive) return null;
  
  const { rahu, ketu } = calculateNodalPositions(currentTime);
  
  return (
    <group>
      {/* Earth at center */}
      <mesh>
        <sphereGeometry args={[earthRadius, 32, 32]} />
        <meshStandardMaterial color={0x6b93d6} />
      </mesh>
      
      {/* Earth label */}
      <Html position={[0, -3.8, 0]} center>
        <div style={{
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.7)',
          padding: '4px 8px',
          borderRadius: '50px', // Square box
          border: '1px solid #6b93d6',
          boxShadow: '0 0 8px rgba(107, 147, 214, 0.3)'
        }}>
          Earth
        </div>
      </Html>
      
      {/* Ecliptic Plane (Earth-Sun orbital plane) */}
      <mesh ref={eclipticPlaneRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[eclipticRadius * 0.8, eclipticRadius, 128]} />
        <meshBasicMaterial 
          color={0xffffff} 
          transparent={true} 
          opacity={0.1} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Ecliptic Plane border */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[eclipticRadius - 0.1, eclipticRadius, 64]} />
        <meshBasicMaterial 
          color={0xffff00} 
          transparent={true} 
          opacity={0.6} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Moon's Orbit */}
      <line ref={moonOrbitRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={360}
            array={new Float32Array(360 * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={0x00ffff} linewidth={3} />
      </line>
      
      {/* Moon */}
      <mesh ref={moonRef}>
        <sphereGeometry args={[moonSize, 16, 16]} />
        <meshStandardMaterial color={0xcccccc} />
      </mesh>
      
      {/* Rahu-Ketu Axis (dashed line) */}
      <line ref={rahuKetuAxisRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineDashedMaterial 
          color={0xff6600} 
          linewidth={4}
          dashSize={0.5}
          gapSize={0.3}
        />
      </line>
      
      {/* Rahu Node */}
      <mesh position={[rahu.x, rahu.y, rahu.z]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color={0xff0000} emissive={0x330000} />
      </mesh>
      
      {/* Rahu Label */}
      <Html position={[rahu.x, rahu.y + 1, rahu.z]} center>
        <div style={{
          color: '#ff6666',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.8)',
          padding: '6px 10px',
          borderRadius: '0px', // Square box
          border: '2px solid #ff6666',
          boxShadow: '0 0 10px rgba(255, 102, 102, 0.3)'
        }}>
          Rahu<br/>
          <span style={{ fontSize: '10px', opacity: 0.8 }}>
            (Ascending Node)
          </span>
        </div>
      </Html>
      
      {/* Ketu Node */}
      <mesh position={[ketu.x, ketu.y, ketu.z]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color={0x4400ff} emissive={0x000033} />
      </mesh>
      
      {/* Ketu Label */}
      <Html position={[ketu.x, ketu.y - 1, ketu.z]} center>
        <div style={{
          color: '#6666ff',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.8)',
          padding: '6px 10px',
          borderRadius: '0px', // Square box
          border: '2px solid #6666ff',
          boxShadow: '0 0 10px rgba(102, 102, 255, 0.3)'
        }}>
          Ketu<br/>
          <span style={{ fontSize: '10px', opacity: 0.8 }}>
            (Descending Node)
          </span>
        </div>
      </Html>
      
      {/* Mobile-optimized Exit Button */}
      <Html position={[isMobile ? 20 : 30, 0, isMobile ? 20 : 30]} center style={{ pointerEvents: 'auto' }}>
        <button
          onClick={() => onExit && onExit()}
          style={{
            background: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            border: '2px solid #ff0000',
            borderRadius: '0px',
            padding: isMobile ? '8px 16px' : '10px 20px',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(255, 0, 0, 0.5)',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 0, 0, 1.0)';
            e.target.style.boxShadow = '0 0 25px rgba(255, 0, 0, 0.8)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 0, 0, 0.8)';
            e.target.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.5)';
            e.target.style.transform = 'scale(1.0)';
          }}
        >
          {isMobile ? 'EXIT' : 'EXIT SIMULATION'}
        </button>
      </Html>
      
      {/* Mobile-optimized Controls Instructions */}
      <Html position={[isMobile ? -15 : -20, isMobile ? 4 : 6, isMobile ? 10 : 15]} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: 'white',
          fontSize: isMobile ? '9px' : '11px',
          background: 'rgba(0,0,0,0.8)',
          padding: isMobile ? '3px 20px' : '4px 36px',
          borderRadius: '20px',
          border: '2px solid rgba(255,255,255,0.5)',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
          maxWidth: isMobile ? '140px' : '180px'
        }}>
          <div style={{ marginBottom: '4px', fontWeight: 'bold', color: '#ffaa00' }}>
            {isMobile ? 'Rahu-Ketu' : 'Rahu-Ketu Simulation'}
          </div>
          <div style={{ fontSize: isMobile ? '8px' : '10px', marginBottom: '6px' }}>
            {isMobile ? 'Tap C: Camera views' : 'Press \'C\' to cycle camera views:'}
          </div>
          {!isMobile && (
            <div style={{ fontSize: '9px', opacity: 0.8 }}>
              • Top-down (XY plane)<br/>
              • 3D Perspective<br/>
              • Side profile (XZ plane)
            </div>
          )}
          <div style={{ fontSize: isMobile ? '8px' : '9px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '4px' }}>
            Current: <span style={{ color: '#66ccff' }}>{isMobile ? cameraView.split('Down')[0] || cameraView.split('Profile')[0] || cameraView : cameraView}</span>
          </div>
          <div style={{ fontSize: isMobile ? '8px' : '9px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '4px', color: '#ff6666' }}>
            {isMobile ? 'Tap R/ESC to exit' : 'Press \'R\' or \'ESC\' to exit'}<br/>
            {isMobile ? 'Or tap EXIT' : 'Click EXIT button above'}
          </div>
        </div>
      </Html>
      
      {/* Mobile-optimized Information Panel */}
      <Html position={[isMobile ? 12 : 18, isMobile ? 4 : 6, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: 'white',
          fontSize: isMobile ? '8px' : '10px',
          background: 'rgba(0,0,0,0.8)',
          padding: isMobile ? '8px 10px' : '10px 14px',
          borderRadius: '0px',
          border: '2px solid rgba(255, 170, 0, 0.8)',
          boxShadow: '0 0 15px rgba(255, 170, 0, 0.3)',
          maxWidth: isMobile ? '140px' : '200px'
        }}>
          <div style={{ marginBottom: '6px', fontWeight: 'bold', color: '#ffaa00' }}>
            {isMobile ? 'Vedic Concept' : 'Vedic Astrology Concept'}
          </div>
          {/* <div style={{ fontSize: '9px', lineHeight: '1.4', opacity: 0.9 }}>
            <strong>Rahu & Ketu:</strong> The lunar nodes where the Moon's orbit intersects the ecliptic plane.
            <br/><br/>
            <strong>Rahu:</strong> Ascending node (Moon crosses from south to north)
            <br/>
            <strong>Ketu:</strong> Descending node (Moon crosses from north to south)
            <br/><br/>
            These points are always 180° apart and precess westward over 18.6 years.
          </div> */}
        </div>
      </Html>
      
      {/* Mobile-optimized orbit and plane labels */}
      <Html position={[0, moonOrbitRadius + (isMobile ? 1 : 1.5), 0]} center>
        <div style={{
          color: '#00ffff',
          fontSize: isMobile ? '10px' : '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.7)',
          padding: isMobile ? '3px 6px' : '4px 8px',
          borderRadius: '0px',
          border: '1px solid #00ffff',
          boxShadow: '0 0 8px rgba(0, 255, 255, 0.3)'
        }}>
          Moon's Orbit<br/>
          <span style={{ fontSize: isMobile ? '8px' : '10px', opacity: 0.8 }}>
            {isMobile ? '(5.14°)' : '(Inclined 5.14°)'}
          </span>
        </div>
      </Html>
      
      <Html position={[eclipticRadius - (isMobile ? 2 : 3), 0, 0]} center>
        <div style={{
          color: '#ffff00',
          fontSize: isMobile ? '10px' : '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.7)',
          padding: isMobile ? '3px 6px' : '4px 8px',
          borderRadius: '0px',
          border: '1px solid #ffff00',
          boxShadow: '0 0 8px rgba(255, 255, 0, 0.3)'
        }}>
          {isMobile ? 'Ecliptic' : 'Ecliptic Plane'}<br/>
          <span style={{ fontSize: isMobile ? '8px' : '10px', opacity: 0.8 }}>
            {isMobile ? '(Earth-Sun)' : '(Earth-Sun Orbital Plane)'}
          </span>
        </div>
      </Html>
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color={0xffffff} />
    </group>
  );
}

export default RahuKetuSimulation;
