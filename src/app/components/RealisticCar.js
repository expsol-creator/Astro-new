import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function RealisticCar(props) {
  const carRef = useRef()
  const keysPressed = useRef({})
  const { camera } = useThree()
  
  // Wheel references for rotation
  const frontLeftWheelRef = useRef()
  const frontRightWheelRef = useRef()
  const rearLeftWheelRef = useRef()
  const rearRightWheelRef = useRef()
  
  // Realistic car physics states
  const velocity = useRef(new THREE.Vector3(0, 0, 0))
  const acceleration = useRef(0)
  const steering = useRef(0)
  const wheelRotation = useRef(0)
  const steerAngle = useRef(0)
  const [isMoving, setIsMoving] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(0)

  // Collision detection function
  const checkCollisions = (position) => {
    const obstacles = [
      { pos: [10, 0, 5], size: 2 }, // Tree 1
      { pos: [-15, 0, -8], size: 2.5 }, // Tree 2
      { pos: [5, 0.5, -12], size: 1.5 }, // Rock 1
      { pos: [-8, 0.3, 15], size: 2 }, // Rock 2
      { pos: [20, 2.5, -5], size: 3.5 }, // Building 1
      { pos: [-12, 1.5, -20], size: 2.5 }, // Building 2
      { pos: [3, 0.5, 8], size: 1 }, // Cone 1
      { pos: [-5, 0.5, -3], size: 1 }, // Cone 2
      { pos: [0, 0.2, -25], size: 4 }, // Barrier 1
      { pos: [25, 0.2, 0], size: 3 }, // Barrier 2
      
      // LUXURY COLONY MANSION COLLISION BOUNDARIES
      { pos: [30, 0, 15], size: 15 }, // Mansion Villa 1 - Grand Estate (full grounds)
      { pos: [-35, 0, -10], size: 18 }, // Mansion Villa 2 - Royal Palace (largest)
      { pos: [15, 0, -35], size: 12 }, // Mansion Villa 3 - Modern Luxury
      { pos: [-25, 0, 30], size: 16 }, // Mansion Villa 4 - Mediterranean Estate
      { pos: [45, 0, -25], size: 20 }, // Mansion Villa 5 - Ultra Modern Penthouse (massive)
      
      // Additional Luxury Homes
      { pos: [50, 0, 10], size: 8 }, // Luxury Home 6
      { pos: [-50, 0, 5], size: 7 }, // Luxury Home 7
      { pos: [25, 0, 40], size: 8 }, // Luxury Home 8
      
      // Colony Infrastructure
      { pos: [0, 0, -60], size: 6 }, // Colony entrance gate
      { pos: [4, 0, 20], size: 1.5 }, // Street light 1
      { pos: [-4, 0, -20], size: 1.5 }, // Street light 2
      { pos: [20, 0, 4], size: 1.5 }, // Street light 3
      
      // Vivek Khanduri Name Object
      { pos: [0, 0, 10], size: 4 }, // Vivek Khanduri Name Monument
    ]

    for (let obstacle of obstacles) {
      const distance = Math.sqrt(
        Math.pow(position.x - obstacle.pos[0], 2) +
        Math.pow(position.z - obstacle.pos[2], 2)
      )
      
      if (distance < obstacle.size) {
        return {
          collision: true,
          normal: new THREE.Vector3(
            (position.x - obstacle.pos[0]) / distance,
            0,
            (position.z - obstacle.pos[2]) / distance
          ),
          obstacleType: obstacle.size > 10 ? 'mansion' : (obstacle.size > 5 ? 'building' : 'small')
        }
      }
    }
    return { collision: false }
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      keysPressed.current[event.code] = true
    }

    const handleKeyUp = (event) => {
      keysPressed.current[event.code] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    if (!carRef.current) return

    // ...existing physics and movement code...
    const maxSpeed = 0.4
    const maxReverseSpeed = 0.25
    const accelerationForce = 0.018
    const reverseAcceleration = 0.012
    const brakeForce = 0.04
    const friction = 0.94
    const steeringSensitivity = 0.025
    const bounceFactor = 0.7
    const maxSteerAngle = Math.PI / 5 // 36 degrees max steering
    
    // Reset acceleration and steering
    acceleration.current = 0
    steering.current = 0
    
    // Fixed Forward/Backward/Reverse movement
    if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) {
      // Always forward acceleration
      acceleration.current = accelerationForce
    }
    if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
      // Check current movement direction for smart braking/reverse
      const currentSpeed = velocity.current.length()
      
      if (currentSpeed > 0.05) {
        // Calculate if we're moving forward or backward
        const forwardDirection = new THREE.Vector3(-Math.sin(carRef.current.rotation.y), 0, -Math.cos(carRef.current.rotation.y))
        const velocityDirection = velocity.current.clone().normalize()
        const dotProduct = forwardDirection.dot(velocityDirection)
        
        if (dotProduct > 0.1) {
          // Moving forward - apply brakes
          acceleration.current = -brakeForce
        } else {
          // Moving backward or sideways - continue reverse
          acceleration.current = -reverseAcceleration
        }
      } else {
        // Stationary or very slow - start reverse
        acceleration.current = -reverseAcceleration
      }
    }
    
    // Fixed steering with proper direction handling
    const currentSpeed = velocity.current.length()
    const speedFactor = Math.min(currentSpeed / maxSpeed, 1)
    
    if (currentSpeed > 0.015) {
      // Calculate movement direction more accurately
      const forwardDirection = new THREE.Vector3(-Math.sin(carRef.current.rotation.y), 0, -Math.cos(carRef.current.rotation.y))
      const velocityDirection = velocity.current.clone().normalize()
      const dotProduct = forwardDirection.dot(velocityDirection)
      
      // Only reverse steering when clearly moving backward
      const steerDirection = dotProduct > -0.3 ? 1 : -1
      
      if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) {
        steering.current = steeringSensitivity * speedFactor * steerDirection
        steerAngle.current = Math.min(steerAngle.current + 0.08, maxSteerAngle)
      }
      if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
        steering.current = -steeringSensitivity * speedFactor * steerDirection
        steerAngle.current = Math.max(steerAngle.current - 0.08, -maxSteerAngle)
      }
    }
    
    // Return steering wheel to center when not steering
    if (!keysPressed.current['KeyA'] && !keysPressed.current['ArrowLeft'] && 
        !keysPressed.current['KeyD'] && !keysPressed.current['ArrowRight']) {
      steerAngle.current = THREE.MathUtils.lerp(steerAngle.current, 0, 0.12)
    }
    
    // Enhanced drift/strafe movement
    if (keysPressed.current['KeyQ']) {
      const strafeForce = new THREE.Vector3(-Math.cos(carRef.current.rotation.y), 0, Math.sin(carRef.current.rotation.y))
      strafeForce.multiplyScalar(0.12 * (1 + speedFactor * 0.3))
      velocity.current.add(strafeForce)
    }
    
    if (keysPressed.current['KeyE']) {
      const strafeForce = new THREE.Vector3(Math.cos(carRef.current.rotation.y), 0, -Math.sin(carRef.current.rotation.y))
      strafeForce.multiplyScalar(0.12 * (1 + speedFactor * 0.3))
      velocity.current.add(strafeForce)
    }
    
    // Apply steering to rotation
    carRef.current.rotation.y += steering.current
    
    // Calculate forward direction (fixed)
    const forward = new THREE.Vector3(-Math.sin(carRef.current.rotation.y), 0, -Math.cos(carRef.current.rotation.y))
    
    // Apply acceleration in forward direction
    const accelerationVector = forward.clone().multiplyScalar(acceleration.current)
    velocity.current.add(accelerationVector)
    
    // Apply friction
    velocity.current.multiplyScalar(friction)
    
    // Fixed speed limiting
    const speed = velocity.current.length()
    if (speed > 0) {
      const forwardDirection = new THREE.Vector3(-Math.sin(carRef.current.rotation.y), 0, -Math.cos(carRef.current.rotation.y))
      const velocityDirection = velocity.current.clone().normalize()
      const dotProduct = forwardDirection.dot(velocityDirection)
      
      // Determine if moving forward or backward
      const isMovingForward = dotProduct > 0
      const speedLimit = isMovingForward ? maxSpeed : maxReverseSpeed
      
      if (speed > speedLimit) {
        velocity.current.normalize().multiplyScalar(speedLimit)
      }
    }
    
    // Update speed display
    const displaySpeed = Math.round(velocity.current.length() * 100)
    setCurrentSpeed(displaySpeed)
    
    // Fixed wheel rotation calculation
    const wheelCircumference = 2 * Math.PI * 0.35
    const distanceTraveled = velocity.current.length()
    
    // Determine correct wheel rotation direction
    if (velocity.current.length() > 0.01) {
      const forwardDirection = new THREE.Vector3(-Math.sin(carRef.current.rotation.y), 0, -Math.cos(carRef.current.rotation.y))
      const velocityDirection = velocity.current.clone().normalize()
      const dotProduct = forwardDirection.dot(velocityDirection)
      
      // Positive rotation for forward, negative for reverse
      const wheelDirection = dotProduct > 0 ? 1 : -1
      wheelRotation.current += (distanceTraveled / wheelCircumference) * 12 * wheelDirection
    }
    
    // Apply wheel rotations
    if (frontLeftWheelRef.current) {
      frontLeftWheelRef.current.rotation.x = wheelRotation.current
      frontLeftWheelRef.current.rotation.y = steerAngle.current
    }
    if (frontRightWheelRef.current) {
      frontRightWheelRef.current.rotation.x = wheelRotation.current
      frontRightWheelRef.current.rotation.y = steerAngle.current
    }
    if (rearLeftWheelRef.current) {
      rearLeftWheelRef.current.rotation.x = wheelRotation.current
    }
    if (rearRightWheelRef.current) {
      rearRightWheelRef.current.rotation.x = wheelRotation.current
    }
    
    // Store current position before movement
    const previousPosition = carRef.current.position.clone()
    
    // Calculate new position
    const newPosition = previousPosition.clone().add(velocity.current)
    
    // Check for collisions at new position
    const collisionResult = checkCollisions(newPosition)
    
    if (collisionResult.collision) {
      const impactSpeed = velocity.current.length()
      const normal = collisionResult.normal
      
      // Enhanced bounce effects based on obstacle type
      let bounceIntensity = bounceFactor
      let upwardBounce = 0.3
      let spinMultiplier = 0.15
      
      // Special handling for Vivek Khanduri name object
      const hitVivekName = Math.sqrt(
        Math.pow(newPosition.x - 0, 2) + Math.pow(newPosition.z - 10, 2)
      ) < 4
      
      if (hitVivekName) {
        // Extra bouncy and dramatic for name object
        bounceIntensity = 1.3
        upwardBounce = 1.2
        spinMultiplier = 0.5
        
        // Spectacular screen shake for hitting the name
        if (impactSpeed > 0.05) {
          const shakeIntensity = impactSpeed * 12
          camera.position.x += (Math.random() - 0.5) * shakeIntensity * 0.3
          camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.3
          camera.position.z += (Math.random() - 0.5) * shakeIntensity * 0.2
        }
      } else if (collisionResult.obstacleType === 'mansion') {
        // Strongest bounce for mansion collisions
        bounceIntensity = 1.1
        upwardBounce = 0.8
        spinMultiplier = 0.35
        
        // Dramatic screen shake for mansion impacts
        if (impactSpeed > 0.1) {
          const shakeIntensity = impactSpeed * 8
          camera.position.x += (Math.random() - 0.5) * shakeIntensity * 0.2
          camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.2
          camera.position.z += (Math.random() - 0.5) * shakeIntensity * 0.15
        }
      } else if (collisionResult.obstacleType === 'building') {
        // Strong bounce for building collisions
        bounceIntensity = 0.95
        upwardBounce = 0.6
        spinMultiplier = 0.25
        
        if (impactSpeed > 0.15) {
          const shakeIntensity = impactSpeed * 6
          camera.position.x += (Math.random() - 0.5) * shakeIntensity * 0.15
          camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.15
          camera.position.z += (Math.random() - 0.5) * shakeIntensity * 0.1
        }
      }
      
      // Enhanced velocity reflection with proper physics
      const reflectedVelocity = velocity.current.clone().reflect(normal)
      
      // Add some randomness to the bounce for realism
      const randomFactor = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        0,
        (Math.random() - 0.5) * 0.1
      )
      reflectedVelocity.add(randomFactor)
      
      velocity.current.copy(reflectedVelocity.multiplyScalar(bounceIntensity))
      
      // Enhanced upward bounce with impact-based intensity
      if (impactSpeed > 0.05) {
        carRef.current.position.y += upwardBounce * impactSpeed * 2
      }
      
      // Apply rotational spin from impact
      const spinForce = (Math.random() - 0.5) * spinMultiplier * impactSpeed
      carRef.current.rotation.y += spinForce
      
      // Additional dramatic effects for major collisions
      if (hitVivekName || collisionResult.obstacleType === 'mansion' || collisionResult.obstacleType === 'building') {
        // Random car rotation for dramatic effect
        carRef.current.rotation.x += (Math.random() - 0.5) * 0.15 * impactSpeed
        carRef.current.rotation.z += (Math.random() - 0.5) * 0.25 * impactSpeed
        
        // Push car away from obstacle more aggressively
        const pushDirection = normal.clone().multiplyScalar(2 * impactSpeed)
        carRef.current.position.add(pushDirection)
      }
      
      // Prevent moving into obstacle
      carRef.current.position.copy(previousPosition)
      
      // Enhanced screen shake for all impacts
      if (impactSpeed > 0.2) {
        const shakeIntensity = impactSpeed * 4
        camera.position.x += (Math.random() - 0.5) * shakeIntensity * 0.12
        camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.12
      }
    } else {
      carRef.current.position.copy(newPosition)
    }
    
    // Visual effects with enhanced reverse indicators
    const visualSpeedFactor = velocity.current.length() / maxSpeed
    setIsMoving(visualSpeedFactor > 0.03)
    
    // Enhanced car tilting
    const tiltAmount = steering.current * visualSpeedFactor * 15
    carRef.current.rotation.z = THREE.MathUtils.lerp(carRef.current.rotation.z, tiltAmount, 0.08)
    
    // Realistic suspension bounce
    const bounceOffset = Math.sin(state.clock.elapsedTime * 12) * visualSpeedFactor * 0.03
    if (carRef.current.position.y > bounceOffset) {
      carRef.current.position.y = THREE.MathUtils.lerp(carRef.current.position.y, bounceOffset, 0.15)
    }
    
    // Enhanced dynamic camera system with FOV adjustment
    const carPosition = carRef.current.position
    const carRotation = carRef.current.rotation.y
    
    const cameraDistance = 10 + visualSpeedFactor * 3
    const cameraHeight = 5 + visualSpeedFactor * 1.5
    
    // Calculate turning intensity for FOV adjustment
    const turningIntensity = Math.abs(steering.current) * speedFactor
    const baseFOV = 65
    const maxFOVIncrease = 15
    const speedFOVIncrease = visualSpeedFactor * 8
    const turnFOVIncrease = turningIntensity * maxFOVIncrease * 100
    
    // Dynamic FOV based on speed and turning
    const targetFOV = baseFOV + speedFOVIncrease + turnFOVIncrease
    const currentFOV = camera.fov
    
    // Smooth FOV transition
    camera.fov = THREE.MathUtils.lerp(currentFOV, Math.min(targetFOV, 85), 0.05)
    camera.updateProjectionMatrix()
    
    // Enhanced camera positioning based on turning
    const lateralOffset = steering.current * speedFactor * 5
    const anticipationOffset = visualSpeedFactor * 2
    
    const idealCameraPosition = {
      x: carPosition.x + Math.sin(carRotation) * cameraDistance + Math.cos(carRotation) * lateralOffset,
      y: carPosition.y + cameraHeight,
      z: carPosition.z + Math.cos(carRotation) * cameraDistance - Math.sin(carRotation) * lateralOffset
    }
    
    // Look-ahead point for smoother camera movement during turns
    const lookAheadDistance = 2 + visualSpeedFactor * 3
    const lookAheadPoint = {
      x: carPosition.x - Math.sin(carRotation) * lookAheadDistance,
      y: carPosition.y + 0.8,
      z: carPosition.z - Math.cos(carRotation) * lookAheadDistance
    }
    
    camera.position.lerp(new THREE.Vector3(idealCameraPosition.x, idealCameraPosition.y, idealCameraPosition.z), 0.06)
    camera.lookAt(lookAheadPoint.x, lookAheadPoint.y, lookAheadPoint.z)
  })

  return (
    <group ref={carRef} {...props} dispose={null}>
      {/* Modern Hatchback Car Body */}
      <group position={[0, 0.6, 0]}>
        {/* Main chassis - Hatchback proportions */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.3, 3.8]} />
          <meshStandardMaterial color="#dc2626" metalness={0.6} roughness={0.3} />
        </mesh>
        
        {/* ...existing car body code... */}
        
        {/* Main cabin - taller and more upright for hatchback */}
        <mesh position={[0, 0.6, -0.2]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 1.2, 2.8]} />
          <meshStandardMaterial color="#b91c1c" metalness={0.4} roughness={0.4} />
        </mesh>
        
        {/* Front section - shorter hood typical of hatchbacks */}
        <mesh position={[0, 0.2, 1.4]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.4, 1.2]} />
          <meshStandardMaterial color="#dc2626" metalness={0.6} roughness={0.3} />
        </mesh>
        
        {/* Rear hatch section - distinctive hatchback feature */}
        <mesh position={[0, 0.8, -1.6]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 1.0, 1.0]} />
          <meshStandardMaterial color="#b91c1c" metalness={0.5} roughness={0.3} />
        </mesh>
        
        {/* Windshield - more upright for hatchback */}
        <mesh position={[0, 0.9, 0.6]} rotation={[-0.2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.8, 0.08]} />
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
        </mesh>
        
        {/* Rear hatch window - large and angled */}
        <mesh position={[0, 1.1, -1.6]} rotation={[0.3, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.8, 0.08]} />
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
        </mesh>
        
        {/* Side windows - smaller, more upright */}
        <mesh position={[-0.8, 0.8, -0.1]} castShadow receiveShadow>
          <boxGeometry args={[0.06, 0.6, 1.8]} />
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
        </mesh>
        <mesh position={[0.8, 0.8, -0.1]} castShadow receiveShadow>
          <boxGeometry args={[0.06, 0.6, 1.8]} />
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
        </mesh>
        
        {/* Modern hatchback headlights - sleeker design */}
        <mesh position={[-0.4, 0.35, 1.9]} castShadow>
          <boxGeometry args={[0.3, 0.15, 0.1]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0.4, 0.35, 1.9]} castShadow>
          <boxGeometry args={[0.3, 0.15, 0.1]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
        </mesh>
        
        {/* Front bumper - modern hatchback style */}
        <mesh position={[0, 0.1, 2.0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.2, 0.2]} />
          <meshStandardMaterial color="#2d2d2d" metalness={0.3} roughness={0.7} />
        </mesh>
        
        {/* Rear spoiler - small roof spoiler typical of hatchbacks */}
        <mesh position={[0, 1.4, -2.0]} castShadow>
          <boxGeometry args={[1.2, 0.06, 0.3]} />
          <meshStandardMaterial color="#dc2626" metalness={0.6} roughness={0.3} />
        </mesh>
        
        {/* Side mirrors */}
        <mesh position={[-0.9, 0.9, 0.4]} castShadow>
          <boxGeometry args={[0.1, 0.08, 0.12]} />
          <meshStandardMaterial color="#2d2d2d" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.9, 0.9, 0.4]} castShadow>
          <boxGeometry args={[0.1, 0.08, 0.12]} />
          <meshStandardMaterial color="#2d2d2d" metalness={0.7} roughness={0.3} />
        </mesh>
        
        {/* Front grille - modern hatchback design */}
        <mesh position={[0, 0.25, 1.95]} castShadow>
          <boxGeometry args={[1.0, 0.2, 0.06]} />
          <meshStandardMaterial color="#2d2d2d" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Door handles */}
        <mesh position={[-0.85, 0.6, 0.2]} castShadow>
          <boxGeometry args={[0.04, 0.08, 0.15]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.85, 0.6, 0.2]} castShadow>
          <boxGeometry args={[0.04, 0.08, 0.15]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Rear door handles */}
        <mesh position={[-0.85, 0.6, -0.6]} castShadow>
          <boxGeometry args={[0.04, 0.08, 0.15]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.85, 0.6, -0.6]} castShadow>
          <boxGeometry args={[0.04, 0.08, 0.15]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Brand badge */}
        <mesh position={[0, 0.35, 1.9]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.015]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.1} />
        </mesh>
        
        {/* Rear badge */}
        <mesh position={[0, 0.8, -2.0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.015]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.1} />
        </mesh>
        
        {/* Fog lights */}
        <mesh position={[-0.6, 0.15, 1.85]} castShadow>
          <sphereGeometry args={[0.08]} />
          <meshStandardMaterial color="#ffffaa" emissive="#ffffaa" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0.6, 0.15, 1.85]} castShadow>
          <sphereGeometry args={[0.08]} />
          <meshStandardMaterial color="#ffffaa" emissive="#ffffaa" emissiveIntensity={0.2} />
        </mesh>
      </group>
      
      {/* Modern Hatchback Wheels - smaller than sports car */}
      {/* Front Left Wheel */}
      <group ref={frontLeftWheelRef} position={[-0.85, 0.3, 1.1]}>
        <mesh castShadow rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2]} />
          <meshStandardMaterial color="#0d0d0d" roughness={0.9} />
        </mesh>
        {/* Modern alloy wheel design */}
        <mesh rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Center cap */}
        <mesh rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.24]} />
          <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      
      {/* Front Right Wheel */}
      <group ref={frontRightWheelRef} position={[0.85, 0.3, 1.1]}>
        <mesh castShadow rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2]} />
          <meshStandardMaterial color="#0d0d0d" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.24]} />
          <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      
      {/* Rear Left Wheel */}
      <group ref={rearLeftWheelRef} position={[-0.85, 0.3, -1.1]}>
        <mesh castShadow rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2]} />
          <meshStandardMaterial color="#0d0d0d" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.24]} />
          <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      
      {/* Rear Right Wheel */}
      <group ref={rearRightWheelRef} position={[0.85, 0.3, -1.1]}>
        <mesh castShadow rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2]} />
          <meshStandardMaterial color="#0d0d0d" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.24]} />
          <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Single exhaust pipe - typical for hatchbacks */}
      {isMoving && (
        <group position={[0.3, 0.2, -1.95]}>
          <mesh>
            <sphereGeometry args={[0.04]} />
            <meshBasicMaterial color="#555555" transparent opacity={0.4} />
          </mesh>
          <mesh position={[0.05, 0.05, -0.1]}>
            <sphereGeometry args={[0.05]} />
            <meshBasicMaterial color="#777777" transparent opacity={0.3} />
          </mesh>
        </group>
      )}
      
      {/* Brake lights when braking - modern hatchback taillights */}
      {keysPressed.current?.['KeyS'] && (
        <>
          <mesh position={[-0.5, 0.6, -1.95]}>
            <boxGeometry args={[0.2, 0.1, 0.05]} />
            <meshBasicMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0.5, 0.6, -1.95]}>
            <boxGeometry args={[0.2, 0.1, 0.05]} />
            <meshBasicMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.8} />
          </mesh>
        </>
      )}
      
      {/* Turn signals - integrated into headlights */}
      {keysPressed.current?.['KeyA'] && (
        <mesh position={[-0.6, 0.3, 1.85]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.6} />
        </mesh>
      )}
      {keysPressed.current?.['KeyD'] && (
        <mesh position={[0.6, 0.3, 1.85]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.6} />
        </mesh>
      )}
    </group>
  )
}  

export default RealisticCar
