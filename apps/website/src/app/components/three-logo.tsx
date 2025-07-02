"use client";

import {
  PerspectiveCamera,
  useGLTF,
  useMatcapTexture,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { GLTF } from "three/examples/jsm/Addons.js";
import * as THREE from "three";
import { useShader } from "@/hook/use-shader";
import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";

type GLTFResult = GLTF & {
  nodes: {
    Xmcp_1: THREE.Mesh;
    Xmcp_2: THREE.Mesh;
  };
  materials: {
    Glass: THREE.MeshPhysicalMaterial;
  };
};

function ThreeLogo() {
  const groupRef = useRef<THREE.Group>(null);
  const { nodes } = useGLTF("/xmcp.glb") as any as GLTFResult;

  const [matcap] = useMatcapTexture("3B3C3F_DAD9D5_929290_ABACA8", 1024);

  // const revealTarget = useFBO(1024, 1024, { type: THREE.FloatType });

  // const revealShader = useShader(
  //   {
  //     vertexShader: /*glsl*/ `
  //     void main() {
  //       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  //     }
  //   `,
  //     fragmentShader: /*glsl*/ `

  //     float revealSdf() {

  //     }

  //     void main() {
  //       gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  //     }
  //   `,
  //   },
  //   {
  //     uTime: { value: 0 },
  //     uReveal: { value: 0 },
  //   }
  // );

  // useFrame((state) => {
  //   const restore = saveGlState(state);

  //   state.gl.setRenderTarget(revealTarget);
  //   state.gl.clear();

  //   restore();
  // });

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
        float s = length(vWorldPosition.xy) + noise(vWorldPosition * 10.) * 0.3;

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
      duration: 1,
      ease: "easeOut",
    });
  }, [reveal]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 1;
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
  return (
    <Canvas className="absolute inset-0 w-full h-full">
      <ThreeLogo />
      <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={30} />
    </Canvas>
  );
};

const noise = `
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
