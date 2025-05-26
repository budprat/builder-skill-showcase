
import React, { useEffect, useRef } from 'react';

interface ParticleSystemProps {
  particleCount?: number;
  type?: 'pollen' | 'rain' | 'photosynthesis';
}

export const EcosystemEffects: React.FC<ParticleSystemProps> = ({ 
  particleCount = 50, 
  type = 'pollen' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const particles: HTMLDivElement[] = [];

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      
      if (type === 'pollen') {
        particle.className = 'digital-pollen';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.setProperty('--x-drift', `${(Math.random() - 0.5) * 200}px`);
      } else if (type === 'rain') {
        particle.className = 'data-rain';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = '-20px';
        particle.style.animationDelay = `${Math.random() * 3}s`;
        particle.style.setProperty('--x-drift', `${(Math.random() - 0.5) * 30}px`);
      } else if (type === 'photosynthesis') {
        particle.className = 'energy-photosynthesis';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.bottom = '0px';
        particle.style.animationDelay = `${Math.random() * 8}s`;
      }

      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, [particleCount, type]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ overflow: 'hidden' }}
    />
  );
};

export const WeatherSystem: React.FC = () => {
  return (
    <>
      <div className="weather-overlay">
        <EcosystemEffects particleCount={30} type="rain" />
      </div>
      <div className="lightning-overlay" />
      <div className="terrain-background" />
      <div className="digital-tree" />
    </>
  );
};

export const BioCircuitOverlay: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 bio-circuit ${className}`} />
  );
};
