
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface ParticleSystemProps {
  className?: string;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      
      // Add particles when mouse moves
      const distance = Math.sqrt(
        Math.pow(newX - lastMouseRef.current.x, 2) + 
        Math.pow(newY - lastMouseRef.current.y, 2)
      );
      
      if (distance > 5) {
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push({
            x: newX + (Math.random() - 0.5) * 10,
            y: newY + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 60,
            maxLife: 60,
            size: Math.random() * 3 + 1
          });
        }
      }
      
      mouseRef.current = { x: newX, y: newY };
      lastMouseRef.current = { x: newX, y: newY };
    };

    // Animation loop
    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vx *= 0.98; // Friction
        particle.vy *= 0.98;

        // Calculate alpha based on life
        const alpha = particle.life / particle.maxLife;
        
        if (alpha > 0) {
          // Draw particle with gradient
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2
          );
          gradient.addColorStop(0, `rgba(20, 184, 166, ${alpha * 0.8})`);
          gradient.addColorStop(0.5, `rgba(139, 92, 246, ${alpha * 0.6})`);
          gradient.addColorStop(1, `rgba(20, 184, 166, 0)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();

          return true; // Keep particle
        }
        return false; // Remove particle
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-10 ${className}`}
      style={{ background: 'transparent' }}
    />
  );
};

export default ParticleSystem;
