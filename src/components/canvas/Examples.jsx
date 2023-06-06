'use client'

import { shaderMaterial, useGLTF } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Line, useCursor, MeshDistortMaterial } from '@react-three/drei'
import { useRouter } from 'next/navigation'
import random from "random";
import { gsap } from 'gsap'

export const Blob = ({ route = '/', ...props }) => {
  const router = useRouter()
  const [hovered, hover] = useState(false)
  useCursor(hovered)
  return (
    <mesh
      onClick={() => router.push(route)}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
      {...props}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial roughness={0} color={hovered ? 'hotpink' : '#1fb2f5'} />
    </mesh>
  )
}

export const Logo = ({ route = '/blob', ...props }) => {
  const mesh = useRef(null)
  const router = useRouter()

  const [hovered, hover] = useState(false)
  const points = useMemo(() => new THREE.EllipseCurve(0, 0, 3, 1.15, 0, 2 * Math.PI, false, 0).getPoints(100), [])

  useCursor(hovered)
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    mesh.current.rotation.y = Math.sin(t) * (Math.PI / 8)
    mesh.current.rotation.x = Math.cos(t) * (Math.PI / 8)
    mesh.current.rotation.z -= delta / 4
  })

  return (
    <group ref={mesh} {...props}>
      {/* @ts-ignore */}
      <Line worldUnits points={points} color='#1fb2f5' lineWidth={0.15} />
      {/* @ts-ignore */}
      <Line worldUnits points={points} color='#1fb2f5' lineWidth={0.15} rotation={[0, 0, 1]} />
      {/* @ts-ignore */}
      <Line worldUnits points={points} color='#1fb2f5' lineWidth={0.15} rotation={[0, 0, -1]} />
      <mesh onClick={() => router.push(route)} onPointerOver={() => hover(true)} onPointerOut={() => hover(false)}>
        <sphereGeometry args={[0.55, 64, 64]} />
        <meshPhysicalMaterial roughness={0} color={hovered ? 'hotpink' : '#1fb2f5'} />
      </mesh>
    </group>
  )
}

export function Duck(props) {
  const { scene } = useGLTF('/duck.glb')

  useFrame((state, delta) => (scene.rotation.y += delta))

  return <primitive object={scene} {...props} />
}
export function Dog(props) {
  const { scene } = useGLTF('/dog.glb')

  return <primitive object={scene} {...props} />
}

export function Spheres(props) {
  const { config, colors, uHold, mouse } = props
  const [prevUHold, setPrevUHold] = useState(0)
  const shaderRef = useRef()
  const meshRef = useRef()

  // const uniforms = useMemo(() => ({
  //   // uTime: new THREE.Uniform(0),
  //   // uMouse: new THREE.Uniform(new THREE.Vector2(0, 0)),
  //   // uHold: new THREE.Uniform(0),
  //   // uScale: new THREE.Uniform(config.scale)
  //   uTime: 0,
  //   uMouse: new THREE.Vector2(0, 0),
  //   uHold: uHold || 0,
  //   uScale: config.scale
  // }), [config.scale, uHold])

  // const CustomShader = shaderMaterial(
  //   uniforms,
  //   vertexShader,
  //   fragmentShader
  // )
  // extend({ CustomShader })
  // let material = new THREE.ShaderMaterial({
  //   fragmentShader,
  //   vertexShader,
  //   uniforms: uniforms
  // });

  // instanced buffer geometry
  const baseGeometry = new THREE.SphereGeometry(1, 8, 8);
  const baseCube = new THREE.BoxGeometry(1, 1, 1);
  let instancedGeometry = new THREE.InstancedBufferGeometry().copy(
    config.useCube ? baseCube : baseGeometry
  );
  let instanceCount = config.nInstances;
  instancedGeometry.maxInstancedCount = instanceCount;
  instancedGeometry.instanceCount = instanceCount;

  let aCurve = [];
  let aColor = [];

  for (let i = 0; i < instanceCount; i++) {
    const radius = random.float(30, 40);
    const progress = random.float();
    const offset = random.float(-5, 5);
    const speed = random.float(0.02, 0.07);
    aCurve.push(radius);
    aCurve.push(progress);
    aCurve.push(offset);
    aCurve.push(speed);
    const color = colors[Math.floor(Math.random() * colors.length)];
    aColor.push(color.r, color.g, color.b);
  }

  // forloop
  instancedGeometry.setAttribute(
    "aCurve",
    new THREE.InstancedBufferAttribute(new Float32Array(aCurve), 4, false)
  );
  instancedGeometry.setAttribute(
    "aColor",
    new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false)
  );

  // useFrame((state, delta) => {
  //   state.camera.position.z = 260
  //   shaderRef.current.uTime = state.clock.elapsedTime * (props.uTime || 1);
    
  //   if (prevUHold !== props.uHold) {
  //     let newUHold = prevUHold
  //     if (prevUHold > props.uHold) {
  //       newUHold = Math.max(props.uHold, prevUHold - 0.05)
  //     } else {
  //       newUHold = Math.min(props.uHold, prevUHold + 0.05)
  //     }
  //     shaderRef.current.uHold = newUHold
  //     setPrevUHold(newUHold)
  //   }

  //   if(mouse) shaderRef.current.uMouse.set(mouse.x || 0, mouse.y || 0);
  // })
  console.log("rerender", prevUHold)

  return (
    <mesh
      ref={meshRef}
      geometry={instancedGeometry}
      position={props.position || [Math.PI/2, 0, 0]}
      rotation={props.rotation || [0, Math.PI/2, 0]}
    >
      {props.children}
      {/* <customShader
        attach="material"
        key={CustomShader.key}
        ref={shaderRef}
        colors={colors}
      /> */}
      {/* <shaderMaterial
        key={CustomShader.key}
        attach="material"
        ref={shaderRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        colors={colors}
        side={THREE.DoubleSide}
      /> */}
    </mesh>
  )
}