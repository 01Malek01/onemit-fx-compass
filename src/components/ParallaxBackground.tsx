import React from 'react';
import { Parallax } from 'react-parallax';
import { motion } from 'framer-motion';

interface ParallaxBackgroundProps {
  children: React.ReactNode;
}

const ParallaxBackground = ({ children }: ParallaxBackgroundProps) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* First parallax layer - Gradient blob */}
      <Parallax
        strength={300}
        className="absolute inset-0"
        renderLayer={(percentage) => (
          <div className="pointer-events-none absolute inset-0 h-screen w-screen">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.7, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute top-[10%] -left-[15%] h-[50vh] w-[50vh] rounded-full bg-gradient-to-br from-primary/40 to-blue-400/20 blur-3xl"
              style={{
                transform: `translate3d(${percentage * 30}px, ${percentage * -15}px, 0)`,
              }}
            />
          </div>
        )}
      >
        <div />
      </Parallax>

      {/* Second parallax layer - Blue gradient circle */}
      <Parallax
        strength={200}
        className="absolute inset-0"
        renderLayer={(percentage) => (
          <div className="pointer-events-none absolute inset-0 h-screen w-screen">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.5, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              className="absolute bottom-[20%] right-[5%] h-[40vh] w-[40vh] rounded-full bg-gradient-to-tl from-blue-500/20 to-purple-400/10 blur-3xl"
              style={{
                transform: `translate3d(${percentage * -20}px, ${percentage * 20}px, 0)`,
              }}
            />
          </div>
        )}
      >
        <div />
      </Parallax>

      {/* Third parallax layer - Subtle grid pattern */}
      <Parallax
        strength={100}
        className="absolute inset-0"
        renderLayer={(percentage) => (
          <div className="pointer-events-none absolute inset-0 h-screen w-screen">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 2, ease: "easeOut", delay: 0.4 }}
              className="absolute inset-0"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
                transform: `translate3d(${percentage * 10}px, ${percentage * 10}px, 0) scale(${1 + percentage * 0.1})`,
              }}
            />
          </div>
        )}
      >
        <div />
      </Parallax>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ParallaxBackground;
