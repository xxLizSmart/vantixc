import { useEffect, useState } from 'react';
import { TrendingUp, LucideIcon } from 'lucide-react';

interface FloatingIcon {
  Icon: LucideIcon;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
}

interface FloatingIconsHeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  icons: LucideIcon[];
}

export default function FloatingIconsHero({
  title,
  subtitle,
  ctaText,
  ctaHref,
  onCtaClick,
  icons,
}: FloatingIconsHeroProps) {
  const [floatingIcons, setFloatingIcons] = useState<FloatingIcon[]>([]);

  useEffect(() => {
    const iconCount = 20;
    const newIcons: FloatingIcon[] = [];

    for (let i = 0; i < iconCount; i++) {
      newIcons.push({
        Icon: icons[Math.floor(Math.random() * icons.length)],
        size: Math.random() * 40 + 30,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5,
      });
    }

    setFloatingIcons(newIcons);
  }, [icons]);

  const handleClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else if (ctaHref) {
      window.location.href = ctaHref;
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-bitget-cyan/5 via-transparent to-bitget-cyan/10 dark:from-bitget-cyan/10 dark:to-bitget-cyan/5" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingIcons.map((item, index) => (
          <div
            key={index}
            className="absolute opacity-10 dark:opacity-5"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              animation: `float ${item.duration}s ease-in-out infinite`,
              animationDelay: `${item.delay}s`,
            }}
          >
            <item.Icon
              className="text-bitget-cyan"
              size={item.size}
              strokeWidth={1.5}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="animate-fade-in">
          <img
            src="/untitled_design_(52).png"
            alt={title}
            className="w-48 md:w-64 h-auto mx-auto mb-12 animate-slide-up drop-shadow-2xl"
          />
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 text-light-text dark:text-dark-text tracking-tight animate-slide-up">
          {title}
        </h1>

        <p className="text-xl md:text-2xl lg:text-3xl text-light-text-secondary dark:text-dark-text-secondary mb-12 font-light animate-slide-up delay-100 max-w-3xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        <button
          onClick={handleClick}
          className="group relative btn-primary text-lg animate-slide-up delay-200 shadow-2xl hover:shadow-bitget-cyan/20 transition-all duration-300"
        >
          <span className="flex items-center justify-center space-x-2">
            <span>{ctaText}</span>
            <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% {
            transform: translateY(-30px) translateX(20px) rotate(5deg);
          }
          50% {
            transform: translateY(-60px) translateX(-20px) rotate(-5deg);
          }
          75% {
            transform: translateY(-30px) translateX(20px) rotate(3deg);
          }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .delay-100 {
          animation-delay: 0.1s;
          animation-fill-mode: both;
        }

        .delay-200 {
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }
      `}</style>
    </section>
  );
}
