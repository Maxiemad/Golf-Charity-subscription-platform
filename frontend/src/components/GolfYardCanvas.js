import { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function GolfYardCanvas() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const isDark = theme === 'dark';
    const bgFill = isDark ? 'rgba(9, 9, 11, 0.05)' : 'rgba(250, 250, 252, 0.05)';
    const particleColor = isDark ? [244, 63, 94] : [220, 38, 78];

    const elements = [];
    const numElements = 50;

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

    const gridLines = [];
    for (let i = 0; i < 8; i++) {
      gridLines.push({
        y: (canvas.height / 8) * i,
        offset: Math.random() * 50,
        speed: Math.random() * 0.2 + 0.1,
      });
    }

    let animationId;

    function animate() {
      ctx.fillStyle = bgFill;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = `rgba(${particleColor.join(',')}, 0.03)`;
      ctx.lineWidth = 1;
      gridLines.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(0, line.y + Math.sin(line.offset) * 20);
        ctx.lineTo(canvas.width, line.y + Math.sin(line.offset) * 20);
        ctx.stroke();
        line.offset += line.speed;
      });

      elements.forEach((element) => {
        element.x += element.speedX;
        element.y += element.speedY;

        if (element.x > canvas.width) element.x = 0;
        if (element.x < 0) element.x = canvas.width;
        if (element.y > canvas.height) element.y = 0;
        if (element.y < 0) element.y = canvas.height;

        ctx.fillStyle = `rgba(${particleColor.join(',')}, ${element.opacity})`;
        ctx.beginPath();
        ctx.arc(element.x, element.y, element.size, 0, Math.PI * 2);
        ctx.fill();

        elements.forEach((otherElement) => {
          const dx = element.x - otherElement.x;
          const dy = element.y - otherElement.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = `rgba(${particleColor.join(',')}, ${(1 - distance / 150) * 0.05})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(otherElement.x, otherElement.y);
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: theme === 'dark' ? 0.4 : 0.15 }}
    />
  );
}
