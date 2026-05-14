'use client';

import { motion } from 'motion/react';

interface RadarLoaderProps {
    size?: number;
}

const RING_DELAYS = [0, 0.8, 1.6];

export function RadarLoader({ size = 120 }: RadarLoaderProps) {
    const orbitDistance = size * 0.44;
    const dotSize = Math.max(10, Math.round(size * 0.09));
    const coreSize = Math.max(16, Math.round(size * 0.14));

    return (
        <div
            className="relative grid place-items-center text-primary"
            style={{ width: size, height: size }}
            aria-hidden="true"
        >
            <motion.div
                className="absolute inset-[18%] rounded-full bg-primary/15 blur-xl"
                animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.45, 0.82, 0.45] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {RING_DELAYS.map((delay) => (
                <motion.div
                    key={delay}
                    className="absolute inset-0 rounded-full border border-primary/25"
                    initial={{ scale: 0.38, opacity: 0 }}
                    animate={{ scale: [0.38, 1], opacity: [0, 0.9, 0] }}
                    transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: [0.16, 1, 0.3, 1],
                        delay,
                    }}
                >
                    <motion.div
                        className="absolute left-1/2 top-1/2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', delay }}
                    >
                        <div
                            className="rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.34)]"
                            style={{
                                width: dotSize,
                                height: dotSize,
                                marginLeft: -dotSize / 2,
                                marginTop: -dotSize / 2,
                                transform: `translateX(${orbitDistance}px)`,
                            }}
                        />
                    </motion.div>
                </motion.div>
            ))}

            <motion.div
                className="relative z-10 rounded-full bg-primary shadow-[0_0_0_10px_hsl(var(--primary)/0.12),0_0_26px_hsl(var(--primary)/0.28)]"
                style={{ width: coreSize, height: coreSize }}
                animate={{ scale: [0.92, 1.14, 0.92] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
            >
                <div
                    className="absolute rounded-full bg-background"
                    style={{
                        width: coreSize * 0.28,
                        height: coreSize * 0.28,
                        left: coreSize * 0.22,
                        top: coreSize * 0.22,
                    }}
                />
            </motion.div>
        </div>
    );
}
