'use client'

import { gsap } from 'gsap'
import dynamic from 'next/dynamic'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import { fragmentShader, vertexShader } from '@/helpers/shaders'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'

const Logo = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Logo), { ssr: false })
const Dog = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Dog), { ssr: false })
const Spheres = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Spheres), { ssr: false })
const Duck = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Duck), { ssr: false })
const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-96 w-full flex-col items-center justify-center'>
      <svg className='-ml-1 mr-3 h-5 w-5 animate-spin text-black' fill='none' viewBox='0 0 24 24'>
        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    </div>
  ),
})
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })

export default function Page() {
  const [config, setConfig] = useState({
    useCube: false,
    nInstances: 4000,
    scale: 1
  })
  const [animating, setAnimating] = useState(false)
  const [closed, setClosed] = useState(false)
  const [uHold, setUHold] = useState(0)

  const defaultAnimation = {
    from: { value: 0 },
    to: {
      value: 1,
      duration: 0.7,
      ease: "power2.inOut",
      onUpdate: setUHold,
      onComplete: () => {
        setAnimating(false);
      }
    }
  }

  let addInstances = count => {
    const newConfig = {...config}
    newConfig.nInstances += count;
    newConfig.nInstances = Math.max(500, newConfig.nInstances);
    let scale = 1 - Math.min(1, (newConfig.nInstances - 500) / 50000) * 0.8;
    newConfig.scale = scale;
    setConfig({...newConfig})
  };
  let handleLess = () => {
    addInstances(-500);
  };

  let handleEvenLess = () => {
    addInstances(-2000);
  };
  let handleMore = () => {
    addInstances(500);
  };
  let handleEvenMore = () => {
    addInstances(2000);
  };
  let handleGeometry = () => {
    setConfig({...config, useCube: !config.useCube})
  }
  let onTap = () => {
    setUHold(uHold === 1 ? 0: 1)
  }

  console.log("rerender page")

  return (
    <>
      <div className='h-full w-full items-center' onClick={onTap}>
        <div id="spheres" uhold={0} className='relative h-full w-full'>
          <View orbit className='relative h-full sm:w-full'>
            <Suspense fallback={null}>
              <Spheres
                config={config}
                colors={[
                  new THREE.Color("#ff3030"),
                  new THREE.Color("#121214")
                ]}
              >
                <SphereShader
                  config={config}
                  uHold={uHold}
                  uTime={1}
                  colors={[
                    new THREE.Color("#ff3030"),
                    new THREE.Color("#121214")
                  ]}
                />
              </Spheres>
              <Spheres
                config={config}
                uTime={-1}
                uHold={uHold}
                rotation={[Math.PI, Math.PI/2, 0]}
                colors={[
                  new THREE.Color("#5050ff"),
                  new THREE.Color("#121214")
                ]}
              >
                <SphereShader
                  config={config}
                  uHold={uHold}
                  uTime={-1}
                  colors={[
                    new THREE.Color("#5050ff"),
                    new THREE.Color("#121214")
                  ]}
                />
              </Spheres>
              <Common color={'lightpink'} />
            </Suspense>
          </View>
        </div>
        <div className="absolute bottom-10 left-0 z-10 flex w-full justify-center">
          <div className="font-serif">
            <div className="font-medium tracking-wide">INSTANCED GEOMETRY</div>
            <div className="text-center text-6xl font-bold">
              {config.nInstances*2}
            </div>
            <div className="mt-4 flex flex-row gap-9 text-xl font-extrabold">
              <div className="cursor-pointer" onClick={handleEvenLess}>&#60;&#60;</div>
              <div className="cursor-pointer" onClick={handleLess}>&#60;</div>
              <div className="cursor-pointer" onClick={handleMore}>&#62;</div>
              <div className="cursor-pointer" onClick={handleEvenMore}>&#62;&#62;</div>
            </div>
            <div className="mt-4 cursor-pointer text-center underline" onClick={handleGeometry}>
              Use {config.useCube ? 'Boxes': 'Cubes'}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


function SphereShader({
  config, uHold, uTime
}) {
  console.log('rerender shader')
  const [prevUHold, setPrevUHold] = useState(0)
  const [mWindow, setMWindow] = useState({})
  const [mouse, setMouse] = useState({})

  const shaderRef = useRef()
  // shaders
  const uniforms = useMemo(() => ({
    // uTime: new THREE.Uniform(0),
    // uMouse: new THREE.Uniform(new THREE.Vector2(0, 0)),
    // uHold: new THREE.Uniform(0),
    // uScale: new THREE.Uniform(config.scale)
    uTime: 0,
    uMouse: new THREE.Vector2(0, 0),
    uHold: uHold || 0,
    uScale: config.scale
  }), [config.scale, uHold])
  const CustomShader = shaderMaterial(
    uniforms,
    vertexShader,
    fragmentShader
  )
  extend({ CustomShader })

  const handleWindowResize = () => {
    setMWindow({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight
    })
  }

  function handleMouseMove(event) {
    let mouse = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1
    };
    console.log("CEK EVENT", window)
    setMouse(mouse)
  }

  useEffect(() => {
    if (window !== undefined) {
      // handleWindowResize();
      // window.addEventListener('resize', handleWindowResize);
      window.addEventListener('mousemove', handleMouseMove)
    }
  }, [])

  function updateShaders(shaderRef, state, uTime) {
    shaderRef.current.uTime = state.clock.elapsedTime * uTime;
    
    if (prevUHold !== uHold) {
      let newUHold = prevUHold
      if (prevUHold > uHold) {
        newUHold = Math.max(uHold, prevUHold - 0.05)
      } else {
        newUHold = Math.min(uHold, prevUHold + 0.05)
      }
      shaderRef.current.uHold = newUHold
      setPrevUHold(newUHold)
    }
    if(mouse) shaderRef.current.uMouse.set(mouse.x || 0, mouse.y || 0);
  }

  useFrame((state, delta) => {
    state.camera.position.z = 260
    if (shaderRef.current) updateShaders(shaderRef, state, uTime)
  })

  return (
    <customShader
      attach="material"
      key={CustomShader.key}
      ref={shaderRef}
      colors={[
        new THREE.Color("#ff3030"),
        new THREE.Color("#121214")
      ]}
    />
  )
}