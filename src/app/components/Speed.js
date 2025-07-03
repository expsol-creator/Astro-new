"use client"
import React, { useRef, useEffect, useState } from 'react'
import { Environment } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
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
        
        {/* I - Second letter */}
        <mesh position={[-1.4, 2, 0]} castShadow>
          <boxGeometry args={[0.15, 1.5, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-1.4, 2.7, 0]} castShadow>
          <boxGeometry args={[0.3, 0.15, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-1.4, 1.3, 0]} castShadow>
          <boxGeometry args={[0.3, 0.15, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* V - Third letter */}
        <mesh position={[-0.8, 2, 0]} castShadow>
          <boxGeometry args={[0.15, 1.5, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-0.4, 2, 0]} castShadow>
          <boxGeometry args={[0.15, 1.5, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-0.6, 1.2, 0]} castShadow>
          <boxGeometry args={[0.4, 0.15, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* E - Fourth letter */}
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[0.15, 1.5, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0.25, 2.7, 0]} castShadow>
          <boxGeometry args={[0.35, 0.15, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0.2, 2, 0]} castShadow>
          <boxGeometry args={[0.25, 0.15, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0.25, 1.3, 0]} castShadow>
          <boxGeometry args={[0.35, 0.15, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* K - Fifth letter */}
        <mesh position={[0.8, 2, 0]} castShadow>
          <boxGeometry args={[0.15, 1.5, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[1.1, 2.4, 0]} castShadow>
          <boxGeometry args={[0.15, 0.6, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[1.0, 2, 0]} castShadow>
          <boxGeometry args={[0.25, 0.15, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[1.1, 1.6, 0]} castShadow>
          <boxGeometry args={[0.15, 0.6, 0.2]} />
          <meshStandardMaterial color="#e53e3e" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* KHANDURI - Second line */}
        {/* K - First letter */}
        <mesh position={[-2.4, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 1.0, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-2.15, 0.75, 0]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-2.25, 0.5, 0]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-2.15, 0.25, 0]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* H - Second letter */}
        <mesh position={[-1.9, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 1.0, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-1.65, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 1.0, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-1.775, 0.5, 0]} castShadow>
          <boxGeometry args={[0.25, 0.12, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* A - Third letter */}
        <mesh position={[-1.3, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 1.0, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-1.05, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 1.0, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-1.175, 1.0, 0]} castShadow>
          <boxGeometry args={[0.25, 0.12, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-1.175, 0.6, 0]} castShadow>
          <boxGeometry args={[0.25, 0.12, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* N - Fourth letter */}
        <mesh position={[-0.7, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 1.0, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-0.45, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 1.0, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-0.575, 0.7, 0]} rotation={[0, 0, 0.4]} castShadow>
          <boxGeometry args={[0.3, 0.12, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* D - Fifth letter */}
        <mesh position={[-0.1, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 1.0, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0.05, 1.0, 0]} castShadow>
          <boxGeometry args={[0.15, 0.12, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0.05, 0, 0]} castShadow>
          <boxGeometry args={[0.15, 0.12, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0.15, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 0.8, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* U - Sixth letter */}
        <mesh position={[0.4, 0.6, 0]} castShadow>
          <boxGeometry args={[0.12, 0.8, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0.65, 0.6, 0]} castShadow>
          <boxGeometry args={[0.12, 0.8, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0.525, 0.12, 0]} castShadow>
          <boxGeometry args={[0.25, 0.12, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* R - Seventh letter */}
        <mesh position={[0.9, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 1.0, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[1.05, 1.0, 0]} castShadow>
          <boxGeometry args={[0.15, 0.12, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[1.15, 0.75, 0]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[1.05, 0.5, 0]} castShadow>
          <boxGeometry args={[0.15, 0.12, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[1.15, 0.25, 0]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* I - Eighth letter */}
        <mesh position={[1.4, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 1.0, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[1.4, 1.0, 0]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[1.4, 0, 0]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.15]} />
          <meshStandardMaterial color="#3182ce" metalness={0.7} roughness={0.2} />
        </mesh>
        
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
        
        {/* East-West Boulevard */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[120, 0.1, 8]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
        </mesh>
        
        {/* Road to Name Monument */}
        <mesh position={[0, -0.05, 5]} receiveShadow>
          <boxGeometry args={[6, 0.1, 10]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
        </mesh>
        
        {/* Road to Villa 1 */}
        <mesh position={[20, -0.05, 15]} receiveShadow>
          <boxGeometry args={[20, 0.1, 6]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
        </mesh>
        
        {/* Road to Villa 2 */}
        <mesh position={[-25, -0.05, -10]} receiveShadow>
          <boxGeometry args={[20, 0.1, 6]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
        </mesh>
        
        {/* Road to Villa 3 */}
        <mesh position={[15, -0.05, -20]} receiveShadow>
          <boxGeometry args={[6, 0.1, 20]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
        </mesh>
        
        {/* Road to Villa 4 */}
        <mesh position={[-20, -0.05, 15]} receiveShadow>
          <boxGeometry args={[6, 0.1, 20]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
        </mesh>
        
        {/* Road to Villa 5 */}
        <mesh position={[30, -0.05, -20]} receiveShadow>
          <boxGeometry args={[20, 0.1, 6]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
        </mesh>
        
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
        
        {/* Guest house */}
        <mesh position={[-12, 1.5, 8]} castShadow>
          <boxGeometry args={[6, 3, 8]} />
          <meshStandardMaterial color="#f0e68c" roughness={0.5} />
        </mesh>
        <mesh position={[-12, 3.2, 8]} castShadow>
          <coneGeometry args={[4, 1.5]} />
          <meshStandardMaterial color="#8b4513" roughness={0.8} />
        </mesh>
        
        {/* Swimming pool */}
        <mesh position={[8, 0.1, -5]} receiveShadow>
          <boxGeometry args={[8, 0.2, 12]} />
          <meshStandardMaterial color="#4169e1" transparent opacity={0.8} />
        </mesh>
        
        {/* Tennis court */}
        <mesh position={[-8, 0.05, -8]} receiveShadow>
          <boxGeometry args={[12, 0.1, 18]} />
          <meshStandardMaterial color="#228b22" roughness={0.9} />
        </mesh>
        
        {/* Gate entrance */}
        <mesh position={[15, 2, 0]} castShadow>
          <boxGeometry args={[1, 4, 0.5]} />
          <meshStandardMaterial color="#8b4513" roughness={0.7} />
        </mesh>
        <mesh position={[15, 2, 3]} castShadow>
          <boxGeometry args={[1, 4, 0.5]} />
          <meshStandardMaterial color="#8b4513" roughness={0.7} />
        </mesh>
      </group>

      {/* Mansion Villa 2 - Royal Palace */}
      <group position={[-35, 0, -10]}>
        {/* Palace grounds */}
        <mesh position={[0, -0.4, 0]} receiveShadow>
          <boxGeometry args={[25, 0.8, 30]} />
          <meshStandardMaterial color="#556b2f" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <boxGeometry args={[20, 0.2, 25]} />
          <meshStandardMaterial color="#696969" roughness={0.8} />
        </mesh>
        
        {/* Central palace */}
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[12, 8, 18]} />
          <meshStandardMaterial color="#daa520" roughness={0.5} />
        </mesh>
        
        {/* Palace towers */}
        <mesh position={[-6, 6, -8]} castShadow>
          <cylinderGeometry args={[2, 2, 12]} />
          <meshStandardMaterial color="#cd853f" roughness={0.6} />
        </mesh>
        <mesh position={[6, 6, -8]} castShadow>
          <cylinderGeometry args={[2, 2, 12]} />
          <meshStandardMaterial color="#cd853f" roughness={0.6} />
        </mesh>
        <mesh position={[-6, 12.5, -8]} castShadow>
          <coneGeometry args={[2.5, 4]} />
          <meshStandardMaterial color="#696969" roughness={0.8} />
        </mesh>
        <mesh position={[6, 12.5, -8]} castShadow>
          <coneGeometry args={[2.5, 4]} />
          <meshStandardMaterial color="#696969" roughness={0.8} />
        </mesh>
        
        {/* Side wings */}
        <mesh position={[-10, 2, 5]} castShadow>
          <boxGeometry args={[6, 4, 12]} />
          <meshStandardMaterial color="#f0e68c" roughness={0.4} />
        </mesh>
        <mesh position={[10, 2, 5]} castShadow>
          <boxGeometry args={[6, 4, 12]} />
          <meshStandardMaterial color="#f0e68c" roughness={0.4} />
        </mesh>
        
        {/* Fountain courtyard */}
        <mesh position={[0, 1.5, 12]} castShadow>
          <cylinderGeometry args={[3, 3, 3]} />
          <meshStandardMaterial color="#708090" roughness={0.4} />
        </mesh>
        <mesh position={[0, 3.5, 12]} castShadow>
          <sphereGeometry args={[1]} />
          <meshStandardMaterial color="#4682b4" transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Mansion Villa 3 - Modern Luxury */}
      <group position={[15, 0, -35]}>
        {/* Modern platform */}
        <mesh position={[0, -0.2, 0]} receiveShadow>
          <boxGeometry args={[20, 0.4, 18]} />
          <meshStandardMaterial color="#708090" roughness={0.4} metalness={0.2} />
        </mesh>
        
        {/* Main modern house */}
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[15, 6, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
        </mesh>
        
        {/* Glass sections */}
        <mesh position={[0, 3, 5.1]} castShadow>
          <boxGeometry args={[12, 5, 0.2]} />
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
        </mesh>
        
        {/* Upper level */}
        <mesh position={[3, 5.5, 0]} castShadow>
          <boxGeometry args={[8, 3, 8]} />
          <meshStandardMaterial color="#f8f8ff" roughness={0.3} />
        </mesh>
        
        {/* Infinity pool */}
        <mesh position={[0, 0.1, 12]} receiveShadow>
          <boxGeometry args={[12, 0.2, 6]} />
          <meshStandardMaterial color="#4169e1" transparent opacity={0.8} />
        </mesh>
        
        {/* Garage */}
        <mesh position={[-8, 1.5, -6]} castShadow>
          <boxGeometry args={[6, 3, 8]} />
          <meshStandardMaterial color="#dcdcdc" roughness={0.4} />
        </mesh>
      </group>

      {/* Mansion Villa 4 - Mediterranean Estate */}
      <group position={[-25, 0, 30]}>
        {/* Terraced gardens */}
        <mesh position={[0, -0.3, 0]} receiveShadow>
          <cylinderGeometry args={[18, 18, 0.6]} />
          <meshStandardMaterial color="#9acd32" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <cylinderGeometry args={[16, 16, 0.2]} />
          <meshStandardMaterial color="#8fbc8f" roughness={0.9} />
        </mesh>
        
        {/* Main villa */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[16, 5, 12]} />
          <meshStandardMaterial color="#deb887" roughness={0.6} />
        </mesh>
        <mesh position={[0, 5.2, 0]} castShadow>
          <cylinderGeometry args={[10, 10, 1.5]} />
          <meshStandardMaterial color="#bc8f8f" roughness={0.8} />
        </mesh>
        
        {/* Villa wings */}
        <mesh position={[-10, 1.8, 4]} castShadow>
          <boxGeometry args={[6, 3.5, 8]} />
          <meshStandardMaterial color="#f5deb3" roughness={0.5} />
        </mesh>
        <mesh position={[10, 1.8, 4]} castShadow>
          <boxGeometry args={[6, 3.5, 8]} />
          <meshStandardMaterial color="#f5deb3" roughness={0.5} />
        </mesh>
        
        {/* Vineyard */}
        <mesh position={[0, 0.05, -12]} receiveShadow>
          <boxGeometry args={[20, 0.1, 8]} />
          <meshStandardMaterial color="#228b22" roughness={0.9} />
        </mesh>
        
        {/* Olive grove */}
        <mesh position={[-12, 0.05, -8]} receiveShadow>
          <boxGeometry args={[8, 0.1, 12]} />
          <meshStandardMaterial color="#556b2f" roughness={0.8} />
        </mesh>
      </group>

      {/* Mansion Villa 5 - Ultra Modern Penthouse */}
      <group position={[45, 0, -25]}>
        {/* Ultra-modern base */}
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[25, 1, 20]} />
          <meshStandardMaterial color="#2f4f4f" roughness={0.3} metalness={0.4} />
        </mesh>
        
        {/* Main structure */}
        <mesh position={[0, 5, 0]} castShadow>
          <boxGeometry args={[18, 10, 14]} />
          <meshStandardMaterial color="#2f4f4f" roughness={0.2} metalness={0.3} />
        </mesh>
        
        {/* Glass elevator */}
        <mesh position={[8, 5, 0]} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 10]} />
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.4} />
        </mesh>
        
        {/* Rooftop terrace */}
        <mesh position={[0, 10.5, 0]} castShadow>
          <boxGeometry args={[16, 1, 12]} />
          <meshStandardMaterial color="#696969" roughness={0.3} />
        </mesh>
        
        {/* Helipad */}
        <mesh position={[0, 11.2, -5]} castShadow>
          <cylinderGeometry args={[4, 4, 0.2]} />
          <meshStandardMaterial color="#ffff00" roughness={0.1} />
        </mesh>
        
        {/* Infinity pool on roof */}
        <mesh position={[0, 11, 5]} receiveShadow>
          <boxGeometry args={[14, 0.4, 6]} />
          <meshStandardMaterial color="#0000cd" transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Additional Luxury Homes */}
      
      {/* Luxury Home 6 */}
      <group position={[50, 0, 10]}>
        <mesh position={[0, -0.2, 0]} receiveShadow>
          <boxGeometry args={[12, 0.4, 12]} />
          <meshStandardMaterial color="#8fbc8f" roughness={0.8} />
        </mesh>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[8, 4, 10]} />
          <meshStandardMaterial color="#daa520" roughness={0.6} />
        </mesh>
        <mesh position={[0, 4.5, 0]} castShadow>
          <coneGeometry args={[6, 2]} />
          <meshStandardMaterial color="#8b4513" roughness={0.8} />
        </mesh>
      </group>

      {/* Luxury Home 7 */}
      <group position={[-50, 0, 5]}>
        <mesh position={[0, -0.2, 0]} receiveShadow>
          <boxGeometry args={[10, 0.4, 10]} />
          <meshStandardMaterial color="#9acd32" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.8, 0]} castShadow>
          <boxGeometry args={[7, 3.5, 8]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.6} />
        </mesh>
        <mesh position={[0, 4, 0]} castShadow>
          <coneGeometry args={[5, 1.5]} />
          <meshStandardMaterial color="#696969" roughness={0.8} />
        </mesh>
      </group>

      {/* Luxury Home 8 */}
      <group position={[25, 0, 40]}>
        <mesh position={[0, -0.15, 0]} receiveShadow>
          <boxGeometry args={[11, 0.3, 11]} />
          <meshStandardMaterial color="#8fbc8f" roughness={0.8} />
        </mesh>
        <mesh position={[0, 2.2, 0]} castShadow>
          <boxGeometry args={[8, 4.5, 9]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0, 5, 0]} castShadow>
          <boxGeometry args={[6, 1, 7]} />
          <meshStandardMaterial color="#696969" roughness={0.3} />
        </mesh>
      </group>

      {/* Colony Infrastructure */}
      
      {/* Street lights along main roads */}
      <group>
        <mesh position={[4, 3, 20]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 6]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.7} />
        </mesh>
        <mesh position={[4, 6.2, 20]} castShadow>
          <sphereGeometry args={[0.3]} />
          <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.2} />
        </mesh>
        
        <mesh position={[-4, 3, -20]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 6]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.7} />
        </mesh>
        <mesh position={[-4, 6.2, -20]} castShadow>
          <sphereGeometry args={[0.3]} />
          <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.2} />
        </mesh>
        
        <mesh position={[20, 3, 4]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 6]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.7} />
        </mesh>
        <mesh position={[20, 6.2, 4]} castShadow>
          <sphereGeometry args={[0.3]} />
          <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.2} />
        </mesh>
      </group>

      {/* Colony entrance gate */}
      <group position={[0, 0, -60]}>
        <mesh position={[-3, 3, 0]} castShadow>
          <boxGeometry args={[1, 6, 2]} />
          <meshStandardMaterial color="#8b4513" roughness={0.7} />
        </mesh>
        <mesh position={[3, 3, 0]} castShadow>
          <boxGeometry args={[1, 6, 2]} />
          <meshStandardMaterial color="#8b4513" roughness={0.7} />
        </mesh>
        <mesh position={[0, 5, 0]} castShadow>
          <boxGeometry args={[8, 1, 2]} />
          <meshStandardMaterial color="#8b4513" roughness={0.7} />
        </mesh>
      </group>

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

      <group position={[-15, 0, -8]}>
        {/* Tree base land */}
        <mesh position={[0, -0.2, 0]} receiveShadow>
          <cylinderGeometry args={[4, 4, 0.4]} />
          <meshStandardMaterial color="#006400" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, 3.5, 0]} castShadow>
          <sphereGeometry args={[2]} />
          <meshStandardMaterial color="#006400" />
        </mesh>
        <mesh position={[0, 0, 0]} visible={false}>
          <cylinderGeometry args={[2.5, 2.5, 0.1]} />
        </mesh>
      </group>

      {/* Rock formations with natural base */}
      <group position={[5, 0, -12]}>
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <cylinderGeometry args={[2.5, 2.5, 0.2]} />
          <meshStandardMaterial color="#8b7355" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[1]} />
          <meshStandardMaterial color="#696969" roughness={0.9} />
        </mesh>
      </group>

      <group position={[-8, 0, 15]}>
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <boxGeometry args={[3, 0.2, 2.5]} />
          <meshStandardMaterial color="#8b7355" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[1.5, 0.6, 1.2]} />
          <meshStandardMaterial color="#808080" roughness={0.8} />
        </mesh>
      </group>

      {/* Buildings with foundation bases */}
      <group position={[20, 0, -5]}>
        <mesh position={[0, -0.2, 0]} receiveShadow>
          <boxGeometry args={[5, 0.4, 5]} />
          <meshStandardMaterial color="#8b7d6b" roughness={0.8} />
        </mesh>
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[3, 5, 3]} />
          <meshStandardMaterial color="#CD853F" roughness={0.7} />
        </mesh>
      </group>

      <group position={[-12, 0, -20]}>
        <mesh position={[0, -0.15, 0]} receiveShadow>
          <boxGeometry args={[4, 0.3, 4]} />
          <meshStandardMaterial color="#8b7d6b" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[2, 3, 2]} />
          <meshStandardMaterial color="#A0522D" roughness={0.6} />
        </mesh>
      </group>

      {/* Traffic cones with road base */}
      <group position={[3, 0, 8]}>
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <cylinderGeometry args={[1, 1, 0.1]} />
          <meshStandardMaterial color="#2f2f2f" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <coneGeometry args={[0.5, 1]} />
          <meshStandardMaterial color="#FF4500" emissive="#FF2200" emissiveIntensity={0.2} />
        </mesh>
      </group>

      <group position={[-5, 0, -3]}>
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <cylinderGeometry args={[1, 1, 0.1]} />
          <meshStandardMaterial color="#2f2f2f" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <coneGeometry args={[0.5, 1]} />
          <meshStandardMaterial color="#FF4500" emissive="#FF2200" emissiveIntensity={0.2} />
        </mesh>
      </group>

      {/* Barriers with concrete foundation */}
      <group position={[0, 0, -25]}>
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <boxGeometry args={[10, 0.2, 1]} />
          <meshStandardMaterial color="#696969" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[8, 0.4, 0.5]} />
          <meshStandardMaterial color="#800000" roughness={0.3} />
        </mesh>
      </group>

      <group position={[25, 0, 0]} rotation={[0, Math.PI/2, 0]}>
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <boxGeometry args={[8, 0.2, 1]} />
          <meshStandardMaterial color="#696969" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[6, 0.4, 0.5]} />
          <meshStandardMaterial color="#800000" roughness={0.3} />
        </mesh>
      </group>
    </>
  )
}

function Speed() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Enhanced Instructions */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        fontFamily: 'Arial',
        fontSize: '14px',
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '8px',
        border: '2px solid #1e40af'
      }}>
        <div>🚗 <strong>Modern Hatchback Car:</strong></div>
        <div>W: Forward Acceleration</div>
        <div>S: Brake/Reverse (Smart Control)</div>
        <div>A/D: Steer Left/Right</div>
        <div>Q/E: Drift Left/Right</div>
        <div style={{marginTop: '5px', fontSize: '12px', color: '#aaa'}}>
          Dynamic FOV • Enhanced camera • Realistic physics
        </div>
      </div>
      
      <Canvas camera={{ position: [0, 4, 8], fov: 65 }} shadows>
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[15, 15, 10]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[0, 5, 0]} intensity={0.4} />
        <Environment preset="sunset" />
        <RealisticCar position={[0, 0, 0]} />
        <Obstacles />
        {/* Enhanced ground */}
        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial 
            color="#1a4d1a" 
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
      </Canvas>
    </div>
  )
}

export default Speed
