import React, { useRef, useMemo, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { UserLocation, LocalWeather } from '../types';

// Fix for TypeScript errors with React Three Fiber intrinsic elements.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface WorldMapPageProps {
  location: UserLocation;
  kpIndex: number;
  weather: LocalWeather;
}

const EARTH_RADIUS = 2.5;
// Slightly larger radius for borders to prevent z-fighting
const BORDER_RADIUS = EARTH_RADIUS + 0.005;

// Approximate magnetic pole coordinates (Northern Hemisphere)
const MAG_NORTH = { lat: 83, lon: -85 };

// Helper to convert Lat/Lon to 3D Cartesian coords
const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
};

// Earth Component with Custom Shader for High Contrast Land/Sea
const Earth = () => {
  const [dayMap, waterMap, nightMap] = useLoader(THREE.TextureLoader, [
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    'https://unpkg.com/three-globe/example/img/earth-water.png', // White = Water, Black = Land
    'https://unpkg.com/three-globe/example/img/earth-night.jpg'
  ]);

  const uniforms = useMemo(() => ({
    dayMap: { value: dayMap },
    nightMap: { value: nightMap },
    specularMap: { value: waterMap },
  }), [dayMap, nightMap, waterMap]);

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      // Pass position for rim lighting calculation
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D dayMap;
    uniform sampler2D nightMap;
    uniform sampler2D specularMap;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      
      // Determine Land vs Sea using specular map (White is water)
      float waterMask = texture2D(specularMap, vUv).r;
      
      // Define Palette
      vec3 seaColor = vec3(0.01, 0.03, 0.12); // Deep Dark Blue
      vec3 landColor = vec3(0.12, 0.20, 0.30); // Visible Blue-Grey Land
      
      // Mix base color
      vec3 color = mix(landColor, seaColor, waterMask);
      
      // Add subtle texture details from day map (desaturated) to land only
      vec3 dayTex = texture2D(dayMap, vUv).rgb;
      float luminance = dot(dayTex, vec3(0.299, 0.587, 0.114));
      if (waterMask < 0.5) {
          color += vec3(luminance) * 0.1; 
      }

      // City Lights (mostly on land)
      vec3 lights = texture2D(nightMap, vUv).rgb;
      // Mask lights by inverse water mask to ensure they don't bleed into ocean too much
      // and boost them for visibility
      color += lights * 1.2 * (1.0 - waterMask);

      // Rim Light (Atmosphere) for 3D definition
      vec3 viewDir = normalize(-vPosition);
      float rim = 1.0 - max(dot(viewDir, normal), 0.0);
      rim = pow(rim, 3.5);
      vec3 atmosphere = vec3(0.1, 0.5, 1.0) * rim * 0.6;
      
      gl_FragColor = vec4(color + atmosphere, 1.0);
    }
  `;

  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <shaderMaterial 
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
};

// Component to fetch and render Country Borders
const Countries = () => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_boundary_lines_land.geojson')
      .then(res => res.json())
      .then(data => {
        const points: number[] = [];
        data.features.forEach((feature: any) => {
          const type = feature.geometry.type;
          const coordinates = feature.geometry.coordinates;

          const addLine = (coords: number[][]) => {
             for (let i = 0; i < coords.length - 1; i++) {
                const start = latLonToVector3(coords[i][1], coords[i][0], BORDER_RADIUS);
                const end = latLonToVector3(coords[i+1][1], coords[i+1][0], BORDER_RADIUS);
                points.push(start.x, start.y, start.z);
                points.push(end.x, end.y, end.z);
             }
          };

          if (type === 'LineString') {
            addLine(coordinates);
          } else if (type === 'MultiLineString') {
            coordinates.forEach((line: number[][]) => addLine(line));
          }
        });

        const bufferGeometry = new THREE.BufferGeometry();
        bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        setGeometry(bufferGeometry);
      })
      .catch(err => console.error("Failed to load country borders", err));
  }, []);

  if (!geometry) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#38bdf8" opacity={0.6} transparent />
    </lineSegments>
  );
};

// Lat/Lon Grid
const Graticule = () => {
  const geometry = useMemo(() => {
    const points = [];
    const radius = EARTH_RADIUS + 0.002;
    // Meridians every 30 deg
    for (let lon = -180; lon <= 180; lon += 30) {
      for (let lat = -90; lat <= 90; lat += 2) {
        const v1 = latLonToVector3(lat, lon, radius);
        const v2 = latLonToVector3(lat + 2, lon, radius);
        points.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
      }
    }
    // Parallels every 30 deg
    for (let lat = -60; lat <= 60; lat += 30) {
        for (let lon = -180; lon <= 180; lon += 5) {
             const v1 = latLonToVector3(lat, lon, radius);
             const v2 = latLonToVector3(lat, lon + 5, radius);
             points.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#ffffff" opacity={0.08} transparent />
    </lineSegments>
  )
}

// Shader-based Aurora Oval
const AuroraOval = ({ kpIndex }: { kpIndex: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const magPole = useMemo(() => {
    return latLonToVector3(MAG_NORTH.lat, MAG_NORTH.lon, 1).normalize();
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uKp: { value: kpIndex },
    uMagPole: { value: magPole },
  }), [kpIndex, magPole]);

  // Update uniforms
  useEffect(() => {
      if (meshRef.current) {
          const material = meshRef.current.material as THREE.ShaderMaterial;
          material.uniforms.uKp.value = kpIndex;
      }
  }, [kpIndex]);

  useFrame((state) => {
    if (meshRef.current) {
       const material = meshRef.current.material as THREE.ShaderMaterial;
       material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const vertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uKp;
    uniform vec3 uMagPole;
    varying vec3 vPosition;

    void main() {
      vec3 pos = normalize(vPosition);
      
      // Calculate angle from magnetic pole
      float dotProd = dot(pos, uMagPole);
      float angle = acos(dotProd); // 0 at pole, PI at south pole
      
      // Determine center latitude of the oval (radians from pole)
      // Base location ~18 degrees from pole (0.31 rad)
      // Expands south (larger angle) with Kp
      float centerAngle = 0.32 + (uKp * 0.025); 
      
      // Width of the band
      float width = 0.12 + (uKp * 0.02);
      
      float dist = abs(angle - centerAngle);
      
      // Soft diffuse edges
      float alpha = smoothstep(width, 0.0, dist);
      
      // Add dynamic noise for "curtain" effect
      // Use simple sine waves for performance
      float noise = sin(pos.x * 30.0 + uTime * 0.5) * sin(pos.z * 30.0 + uTime * 0.3);
      float noise2 = sin(pos.x * 15.0 - uTime * 0.2) * cos(pos.z * 15.0 + uTime * 0.4);
      
      // Modulate intensity
      alpha = alpha * (0.6 + 0.4 * noise * noise2);
      
      // Enhance brightness in the center of the band
      alpha = pow(alpha, 0.8);

      // Boost overall intensity for visibility
      alpha *= 0.8; 
      
      if (alpha <= 0.02) discard;

      // Color Gradient: Green core, slightly fading to teal/transparent
      vec3 color = vec3(0.1, 1.0, 0.3); // Neon Green
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  return (
    <mesh ref={meshRef}>
      {/* Slightly larger than earth to sit above */}
      <sphereGeometry args={[EARTH_RADIUS * 1.08, 128, 128]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// User Location Marker (Glowing Dot)
const UserMarker = ({ lat, lon }: { lat: number; lon: number }) => {
  const position = useMemo(() => latLonToVector3(lat, lon, EARTH_RADIUS + 0.005), [lat, lon]);

  return (
    <group position={position}>
       {/* Core Dot */}
       <mesh>
         <sphereGeometry args={[0.015, 16, 16]} />
         <meshBasicMaterial color="#ffffff" toneMapped={false} />
       </mesh>
       {/* Inner Glow */}
       <mesh>
         <sphereGeometry args={[0.03, 16, 16]} />
         <meshBasicMaterial color="#00d4ff" transparent opacity={0.6} toneMapped={false} />
       </mesh>
       {/* Outer Pulse */}
       <mesh>
         <sphereGeometry args={[0.06, 16, 16]} />
         <meshBasicMaterial color="#00d4ff" transparent opacity={0.2} toneMapped={false} />
       </mesh>
       <pointLight color="#00d4ff" distance={0.5} intensity={2} decay={2} />
    </group>
  );
};

// Atmosphere Glow
const AtmosphereGlow = () => {
    return (
        <mesh>
            <sphereGeometry args={[EARTH_RADIUS + 0.35, 64, 64]} />
            <meshPhongMaterial 
                color="#0044aa" 
                transparent 
                opacity={0.15} 
                side={THREE.BackSide} 
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </mesh>
    )
}

// Background Stars with slow rotation
const MovingStars = () => {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (ref.current) {
      // Very slow drift to prevent "shimmering" effect from movement
      ref.current.rotation.y -= delta * 0.005; 
      ref.current.rotation.x += delta * 0.001; 
    }
  });

  return (
    <group ref={ref}>
      <Stars 
        radius={300} 
        depth={50} 
        count={5000} // Balanced count for larger size
        factor={20}  // 2.5x bigger (7 -> 20)
        saturation={0} 
        fade={false} // Disabled fade to ensure constant brightness (no twinkling)
        speed={0}    // Speed 0 stops shader animation
      />
    </group>
  );
};

const LoadingFallback = () => (
    <Html center>
        <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-aurora-green border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-aurora-green uppercase tracking-widest">Loading Map...</span>
        </div>
    </Html>
);

const WorldMapPage: React.FC<WorldMapPageProps> = ({ location, kpIndex, weather }) => {
  return (
    <div className="fixed inset-0 z-0 bg-[#02050c]">
      <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
        <Suspense fallback={<LoadingFallback />}>
            <ambientLight intensity={0.1} />
            <pointLight position={[15, 10, 10]} intensity={1.5} color="#ffffff" />
            <directionalLight position={[-10, 5, 2]} intensity={0.5} />
            
            <MovingStars />
            
            <group>
                <Earth />
                <Countries />
                <Graticule />
                <AtmosphereGlow />
                <AuroraOval kpIndex={kpIndex} />
                {location.available && (
                    <UserMarker lat={location.latitude} lon={location.longitude} />
                )}
            </group>
            
            <OrbitControls 
                enablePan={false} 
                minDistance={3.5} 
                maxDistance={12} 
                zoomSpeed={0.5}
                rotateSpeed={0.4}
                autoRotate
                autoRotateSpeed={0.3}
                dampingFactor={0.1}
            />
        </Suspense>
      </Canvas>

      <div className="absolute top-6 left-6 z-50 pointer-events-none max-w-[280px]">
        <div className="glass-panel px-5 py-4 rounded-3xl pointer-events-auto flex flex-col gap-1 shadow-2xl backdrop-blur-xl bg-[#0d121e]/40">
           <div className="flex items-center gap-2 mb-1">
             <div className={`w-2 h-2 rounded-full animate-pulse ${kpIndex > 5 ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-aurora-green shadow-[0_0_8px_#00ff9d]'}`}></div>
             <span className="text-[10px] text-aurora-blue font-bold tracking-widest uppercase">3D Live View</span>
           </div>
           
           <h2 className="text-white font-display font-bold text-2xl leading-none">Global Aurora</h2>
           
           <div className="flex items-baseline gap-2 mt-1">
             <span className="text-sm text-gray-400 font-medium">Kp Index</span>
             <span className="font-mono text-lg font-bold text-white">{kpIndex.toFixed(1)}</span>
           </div>
           
           <p className="text-[10px] text-gray-500 leading-tight mt-1 border-t border-white/10 pt-2">
             Drag to rotate. Scroll to zoom.
           </p>
        </div>
      </div>
    </div>
  );
};

export default WorldMapPage;