"use client";

import {
  PerspectiveCamera,
  useFBO,
  useGLTF,
  useMatcapTexture,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { GLTF } from "three/examples/jsm/Addons.js";
import * as THREE from "three";
import { useShader } from "@/hook/use-shader";
import { saveGlState } from "@/utils/save-gl-state";

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

  const revealTarget = useFBO(1024, 1024, { type: THREE.FloatType });

  const revealShader = useShader(
    {
      vertexShader: /*glsl*/ `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: /*glsl*/ `
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `,
    },
    {
      uTime: { value: 0 },
      uReveal: { value: 0 },
    }
  );

  useFrame((state) => {
    const restore = saveGlState(state);

    state.gl.setRenderTarget(revealTarget);
    state.gl.clear();

    restore();
  });

  const matcapMaterial = useShader(
    {
      vertexShader: /*glsl*/ `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: /*glsl*/ `

      uniform sampler2D uMatcap;
      uniform sampler2D uReveal;

      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `,
    },
    {
      uReveal: { value: revealTarget },
      uMatcap: { value: matcap },
    }
  );

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
