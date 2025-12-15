import React, { useEffect, useState } from 'react';

export const ParticleBackground: React.FC = () => {
    // Generate static particles to avoid hydration mismatch
    // In a real app we might use a canvas, but for < 50 particles CSS is fine
    const [particles, setParticles] = useState<Array<{ id: number; left: string; top: string; delay: string; duration: string; size: number }>>([]);

    useEffect(() => {
        const newParticles = Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${10 + Math.random() * 10}s`,
            size: Math.random() * 3 + 1
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#0a0a0a]">
            {/* Background Gradient Mesh */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

            {/* Particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute bg-white rounded-full opacity-20 animate-float"
                    style={{
                        left: p.left,
                        top: p.top,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        animationDelay: p.delay,
                        animationDuration: p.duration
                    }}
                />
            ))}

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); opacity: 0.1; }
                    50% { opacity: 0.3; }
                    100% { transform: translateY(-100px); opacity: 0; }
                }
                .animate-float {
                    animation-name: float;
                    animation-iteration-count: infinite;
                    animation-timing-function: linear;
                }
            `}</style>
        </div>
    );
};
