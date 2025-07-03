import React from 'react'

function Obstacles() {
  return (
    <>
      {/* VIVEK KHANDURI NAME MONUMENT */}
      <group position={[0, 0, 10]}>
        {/* Monument base platform */}
        <mesh position={[0, -0.3, 0]} receiveShadow>
          <cylinderGeometry args={[6, 6, 0.6]} />
          <meshStandardMaterial color="#4a5568" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <cylinderGeometry args={[5, 5, 0.2]} />
          <meshStandardMaterial color="#2d3748" roughness={0.7} />
        </mesh>
        
        {/* ...existing monument code... */}
        
        {/* Decorative pillars */}
        <mesh position={[-3, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 3]} />
          <meshStandardMaterial color="#f7fafc" roughness={0.3} />
        </mesh>
        <mesh position={[3, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 3]} />
          <meshStandardMaterial color="#f7fafc" roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.5, -3]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 3]} />
          <meshStandardMaterial color="#f7fafc" roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.5, 3]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 3]} />
          <meshStandardMaterial color="#f7fafc" roughness={0.3} />
        </mesh>
        
        {/* V - First letter */}
        <mesh position={[-2.2, 2, 0]} castShadow>
          <boxGeometry args={[0.15, 1.5, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-1.8, 2, 0]} castShadow>
          <boxGeometry args={[0.15, 1.5, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-2.0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.4, 0.15, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* ...existing letter components... */}
        
        {/* Decorative lights around the name */}
        <mesh position={[-2.5, 3, 0]} castShadow>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[2.5, 3, 0]} castShadow>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[-2.5, -0.5, 0]} castShadow>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[2.5, -0.5, 0]} castShadow>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* LUXURY COLONY SECTION */}
      
      {/* Main Colony Road Network */}
      <group>
        {/* Main Boulevard - North-South */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[8, 0.1, 120]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
        </mesh>
        
        {/* ...existing road network code... */}
        
        {/* Yellow road markings */}
        <mesh position={[0, -0.04, 0]} receiveShadow>
          <boxGeometry args={[0.3, 0.02, 120]} />
          <meshStandardMaterial color="#ffff00" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.04, 0]} receiveShadow>
          <boxGeometry args={[120, 0.02, 0.3]} />
          <meshStandardMaterial color="#ffff00" roughness={0.6} />
        </mesh>
      </group>

      {/* LUXURY MANSION COLONY */}
      
      {/* Mansion Villa 1 - Grand Estate */}
      <group position={[30, 0, 15]}>
        {/* Estate grounds */}
        <mesh position={[0, -0.3, 0]} receiveShadow>
          <cylinderGeometry args={[15, 15, 0.6]} />
          <meshStandardMaterial color="#8fbc8f" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <cylinderGeometry args={[12, 12, 0.1]} />
          <meshStandardMaterial color="#daa520" roughness={0.9} />
        </mesh>
        
        {/* Main mansion */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[10, 5, 15]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.6} />
        </mesh>
        <mesh position={[0, 5.5, 0]} castShadow>
          <coneGeometry args={[8, 3]} />
          <meshStandardMaterial color="#8b4513" roughness={0.8} />
        </mesh>
        
        {/* ...existing mansion components... */}
      </group>

      {/* ...existing luxury homes and infrastructure... */}

      {/* Enhanced existing obstacles with base lands */}
      <group position={[10, 0, 5]}>
        {/* Tree base land */}
        <mesh position={[0, -0.15, 0]} receiveShadow>
          <cylinderGeometry args={[3, 3, 0.3]} />
          <meshStandardMaterial color="#228b22" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, 3, 0]} castShadow>
          <sphereGeometry args={[1.5]} />
          <meshStandardMaterial color="#228B22" />
        </mesh>
        <mesh position={[0, 0, 0]} visible={false}>
          <cylinderGeometry args={[2, 2, 0.1]} />
        </mesh>
      </group>

      {/* ...existing trees, rocks, buildings, cones, and barriers... */}
    </>
  )
}

export default Obstacles
