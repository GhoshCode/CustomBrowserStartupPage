import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export function Backdrop() {
  const { backgroundImage, overlayOpacity, backgroundBlur } = useStore((s) => s.settings);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let width = canvas.width;
    let height = canvas.height;
    
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      char?: string;
    }

    const nodes: Node[] = [];
    const numNodes = 40;
    const glyphs = ['{', '}', ';', '/', '<', '>', '*'];

    const init = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      nodes.length = 0;
      for (let i = 0; i < numNodes; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          char: Math.random() > 0.7 ? glyphs[Math.floor(Math.random() * glyphs.length)] : undefined,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.font = '14px var(--font-sans)';

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
        }

        if (node.char) {
          ctx.fillText(node.char, node.x, node.y);
        } else {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }

      if (!prefersReducedMotion) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    init();
    draw();

    window.addEventListener('resize', init);
    
    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-[var(--color-base)]">
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
            filter: `blur(${backgroundBlur}px)`
          }}
        />
      )}
      <div 
        className="absolute inset-0 bg-[var(--color-base)]" 
        style={{ opacity: backgroundImage ? overlayOpacity : 0 }} 
      />
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none" 
      />
    </div>
  );
}
