
import React, { useEffect, useRef, useState } from 'react';

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: string[];
  energy: number;
  pulsePhase: number;
}

interface Connection {
  from: string;
  to: string;
  strength: number;
  flowPhase: number;
}

interface NeuralNetworkProps {
  nodeCount?: number;
  className?: string;
  interactive?: boolean;
}

export const NeuralNetwork: React.FC<NeuralNetworkProps> = ({
  nodeCount = 50,
  className = '',
  interactive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Initialize nodes and connections
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const newNodes: Node[] = [];
    const newConnections: Connection[] = [];

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      const node: Node = {
        id: `node-${i}`,
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: [],
        energy: Math.random(),
        pulsePhase: Math.random() * Math.PI * 2
      };
      newNodes.push(node);
    }

    // Create connections
    newNodes.forEach((node, i) => {
      const connectionCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < connectionCount; j++) {
        const targetIndex = Math.floor(Math.random() * newNodes.length);
        if (targetIndex !== i && !node.connections.includes(newNodes[targetIndex].id)) {
          node.connections.push(newNodes[targetIndex].id);
          newConnections.push({
            from: node.id,
            to: newNodes[targetIndex].id,
            strength: Math.random(),
            flowPhase: Math.random() * Math.PI * 2
          });
        }
      }
    });

    setNodes(newNodes);
    setConnections(newConnections);
  }, [nodeCount]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Clear canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;

      // Update and draw connections
      connections.forEach(connection => {
        const fromNode = nodes.find(n => n.id === connection.from);
        const toNode = nodes.find(n => n.id === connection.to);
        
        if (fromNode && toNode) {
          // Calculate distance for interaction
          const distToMouse = Math.sqrt(
            Math.pow((fromNode.x + toNode.x) / 2 - mousePos.x, 2) +
            Math.pow((fromNode.y + toNode.y) / 2 - mousePos.y, 2)
          );
          
          const interactive = distToMouse < 100;
          const opacity = interactive ? 0.6 : 0.2;
          
          // Draw connection line
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = interactive ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.stroke();

          // Draw flow animation
          const flowPosition = (Math.sin(time + connection.flowPhase) + 1) / 2;
          const flowX = fromNode.x + (toNode.x - fromNode.x) * flowPosition;
          const flowY = fromNode.y + (toNode.y - fromNode.y) * flowPosition;
          
          ctx.fillStyle = `rgba(20, 184, 166, ${opacity * 2})`;
          ctx.beginPath();
          ctx.arc(flowX, flowY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Update and draw nodes
      nodes.forEach(node => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off walls
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Keep within bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        // Calculate interaction with mouse
        const distToMouse = Math.sqrt(
          Math.pow(node.x - mousePos.x, 2) + Math.pow(node.y - mousePos.y, 2)
        );
        
        const isHovered = distToMouse < 50;
        const size = isHovered ? 8 : 4;
        const pulseIntensity = Math.sin(time * 2 + node.pulsePhase) * 0.3 + 0.7;

        // Draw node glow
        if (isHovered) {
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 15);
          gradient.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
          gradient.addColorStop(1, 'rgba(20, 184, 166, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw node
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size);
        gradient.addColorStop(0, `rgba(139, 92, 246, ${pulseIntensity})`);
        gradient.addColorStop(0.7, `rgba(20, 184, 166, ${pulseIntensity * 0.8})`);
        gradient.addColorStop(1, 'rgba(20, 184, 166, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, connections, mousePos]);

  // Mouse tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      onMouseMove={handleMouseMove}
      style={{ background: 'transparent' }}
    />
  );
};

export default NeuralNetwork;
