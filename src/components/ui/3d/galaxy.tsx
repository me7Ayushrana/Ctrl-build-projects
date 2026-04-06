"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GalaxyProps {
    isDiving?: boolean;
    onDive?: () => void;
}

export default function Galaxy({ isDiving = false, onDive }: GalaxyProps) {
    const pointsRef = useRef<THREE.Points>(null);

    // Galaxy parameters - Tuned for DevMatch Aesthetics
    const parameters = {
        count: 5000,
        size: 0.015,
        radius: 8,
        branches: 3,
        spin: 1.2,
        randomness: 0.25,
        randomnessPower: 3,
        insideColor: "#ffffff", // Core glow
        outsideColor: "#6366f1", // Indigo/Primary blue
    };

    const sceneData = useMemo(() => {
        const positions = new Float32Array(parameters.count * 3);
        const colors = new Float32Array(parameters.count * 3);
        const scales = new Float32Array(parameters.count);

        const colorInside = new THREE.Color(parameters.insideColor);
        const colorOutside = new THREE.Color(parameters.outsideColor);

        for (let i = 0; i < parameters.count; i++) {
            const i3 = i * 3;

            // Position calculation (Spiral math)
            const radius = Math.random() * parameters.radius;
            const spinAngle = radius * parameters.spin;
            const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

            const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
            const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
            const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;

            positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

            // Color blending
            const mixedColor = colorInside.clone();
            mixedColor.lerp(colorOutside, radius / parameters.radius);

            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;

            // Random scales for variety
            scales[i] = Math.random();
        }

        return { positions, colors, scales };
    }, []);

    useFrame((state, delta) => {
        if (pointsRef.current) {
            // Base rotation
            const rotationSpeed = isDiving ? 15.0 : 0.05;
            pointsRef.current.rotation.y += delta * rotationSpeed;

            if (isDiving) {
                // WARP DRIVE EFFECT: Pull camera toward center
                state.camera.position.lerp(new THREE.Vector3(0, 0, 1), delta * 2.0);
                state.camera.lookAt(0, 0, 0);
            } else {
                // Gentle floating camera
                state.camera.position.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 2;
                state.camera.position.y = Math.cos(state.clock.getElapsedTime() * 0.2) * 1;
                state.camera.lookAt(0, 0, 0);
            }
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[sceneData.positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[sceneData.colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={parameters.size}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                vertexColors={true}
                transparent
                opacity={0.8}
            />
        </points>
    );
}
