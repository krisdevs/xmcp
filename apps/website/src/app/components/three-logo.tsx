"use client";

import {
  PerspectiveCamera,
  useGLTF,
  useMatcapTexture,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { GLTF } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

interface ThreeLogoProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

type GLTFResult = GLTF & {
  nodes: {
    Xmcp_1: THREE.Mesh;
    Xmcp_2: THREE.Mesh;
  };
  materials: {
    Glass: THREE.MeshPhysicalMaterial;
  };
};

function ThreeLogo({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: ThreeLogoProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { nodes } = useGLTF("/xmcp.glb") as any as GLTFResult;

  const [matcap] = useMatcapTexture("3B3C3F_DAD9D5_929290_ABACA8", 1024);

  return (
    <group ref={groupRef} scale={scale} position={position} rotation={rotation}>
      <primitive object={nodes.Xmcp_1}>
        <meshMatcapMaterial matcap={matcap} />
      </primitive>
      <primitive object={nodes.Xmcp_2}>
        <meshMatcapMaterial matcap={matcap} />
      </primitive>
    </group>
  );
}

// Preload the model for better performance
useGLTF.preload("/xmcp.glb");

export const CavasLogo = () => {
  return (
    <Canvas>
      <ThreeLogo />
      <PerspectiveCamera makeDefault position={[0, 0, 1.5]} fov={45} />
    </Canvas>
  );
};
