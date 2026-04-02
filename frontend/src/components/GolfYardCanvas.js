import { useEffect, useRef } from 'react';

export function GolfYardCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Golf yard inspired abstract elements
    const elements = [];
    const numElements = 50;

    // Create abstract golf-inspired particles
    for (let i = 0; i < numElements; i++) {
      elements.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    // Add subtle grid lines (like golf yard)
    const gridLines = [];
    for (let i = 0; i < 8; i++) {
      gridLines.push({
        y: (canvas.height / 8) * i,
        offset: Math.random() * 50,
        speed: Math.random() * 0.2 + 0.1,
      });
    }

    function animate() {
      // Create fade effect
      ctx.fillStyle = 'rgba(9, 9, 11, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid lines (like yard lines)
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.03)';
      ctx.lineWidth = 1;
      gridLines.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(0, line.y + Math.sin(line.offset) * 20);
        ctx.lineTo(canvas.width, line.y + Math.sin(line.offset) * 20);
        ctx.stroke();
        line.offset += line.speed;
      });

      // Draw moving particles
      elements.forEach((element) => {
        // Update position
        element.x += element.speedX;
        element.y += element.speedY;

        // Wrap around edges
        if (element.x > canvas.width) element.x = 0;
        if (element.x < 0) element.x = canvas.width;
        if (element.y > canvas.height) element.y = 0;
        if (element.y < 0) element.y = canvas.height;

        // Draw particle
        ctx.fillStyle = `rgba(244, 63, 94, ${element.opacity})`;
        ctx.beginPath();
        ctx.arc(element.x, element.y, element.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw subtle connections (like golf net pattern)
        elements.forEach((otherElement) => {
          const dx = element.x - otherElement.x;
          const dy = element.y - otherElement.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = `rgba(244, 63, 94, ${(1 - distance / 150) * 0.05})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(otherElement.x, otherElement.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    }

    animate();

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  );
}
