"use client";

import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { Group } from "three";

interface ThreeLogoProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

function ThreeLogo({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: ThreeLogoProps) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF("/xmcp.glb");

  return (
    <group ref={groupRef} scale={scale} position={position} rotation={rotation}>
      <primitive object={scene} />
    </group>
  );
}

// Preload the model for better performance
useGLTF.preload("/xmcp.glb");

export { ThreeLogo };
