"use client";

import {
  PerspectiveCamera,
  useGLTF,
  useMatcapTexture,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { GLTF } from "three/examples/jsm/Addons.js";
import * as THREE from "three";
import { useShader } from "@/hook/use-shader";
import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import { cn } from "@/utils/cn";
import { create } from "zustand";

type GLTFResult = GLTF & {
  nodes: {
    Xmcp_1: THREE.Mesh;
    Xmcp_2: THREE.Mesh;
  };
  materials: {
    Glass: THREE.MeshPhysicalMaterial;
  };
};

const useGL = create<{
  isLoaded: boolean;
  setIsLoaded: (isLoaded: boolean) => void;
}>((set) => ({
  isLoaded: false,
  setIsLoaded: (isLoaded) => set({ isLoaded }),
}));

function ThreeLogo() {
  const groupRef = useRef<THREE.Group>(null);
  const { nodes } = useGLTF("/xmcp.glb") as any as GLTFResult;

  const [matcap] = useMatcapTexture("3B3C3F_DAD9D5_929290_ABACA8", 1024);

  const gl = useThree((state) => state.gl);

  gl.setClearColor(0x000000, 1);

  const matcapMaterial = useShader(
    {
      transparent: true,
      vertexShader: /*glsl*/ `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        // Transform normal to view space
        vNormal = normalize(normalMatrix * normal);
        
        // Calculate view position
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;

        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
      fragmentShader: /*glsl*/ `
      uniform sampler2D uMatcap;
      uniform float uReveal;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      ${noise}

      float revealSdf() {
         float s = -vWorldPosition.y * 0.4 + 0.5 + noise(vWorldPosition * 10.) * 0.1;
         s -= uReveal;
         s = step(s, 0.02);
         return s;
       }

      
      void main() {
        vec3 viewDir = normalize( vViewPosition );
        vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
        vec3 y = cross( viewDir, x );
        vec2 uv = vec2( dot( x, vNormal ), dot( y, vNormal ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks
        
        // Sample the matcap texture
        vec4 matcapColor = texture2D(uMatcap, uv);

        float reveal = revealSdf();
        
        gl_FragColor.rgb = matcapColor.rgb;
        gl_FragColor.a = reveal;
      }
    `,
    },
    {
      uReveal: { value: 0 },
      uMatcap: { value: matcap },
    }
  );

  const reveal = useMotionValue(0);

  useMotionValueEvent(reveal, "change", (value) => {
    matcapMaterial.uniforms.uReveal.value = value;
  });

  useEffect(() => {
    animate(reveal, 0.9, {
      duration: 1.5,
      ease: "easeOut",
    });
  }, [reveal]);

  const startedRef = useRef(false);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 1;
    }

    if (!startedRef.current) {
      startedRef.current = true;
      useGL.setState({ isLoaded: true });
    }
  });

  return (
    <group ref={groupRef} scale-z={2} rotation-y={-Math.PI * 0.2}>
      <primitive object={nodes.Xmcp_1} material={matcapMaterial}></primitive>
      <primitive object={nodes.Xmcp_2} material={matcapMaterial}></primitive>
    </group>
  );
}

// Preload the model for better performance
useGLTF.preload("/xmcp.glb");

export const CavasLogo = () => {
  const { isLoaded } = useGL();

  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      className={cn("absolute inset-0 w-full h-full", {
        "opacity-0": !isLoaded,
      })}
    >
      <ThreeLogo />
      <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={30} />
      <color attach="background" args={["#000000"]} />
    </Canvas>
  );
};

const noise = /*glsl*/ `
float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}
`;
