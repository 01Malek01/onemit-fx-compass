
import React from 'react';
import { Parallax } from 'react-parallax';
import { motion } from 'framer-motion';

interface ParallaxBackgroundProps {
  children: React.ReactNode;
}

const ParallaxBackground = ({ children }: ParallaxBackgroundProps) => {
  return (
    <div className="fixed inset-0 w-full min-h-screen overflow-hidden bg-[#0A0B0D] flex items-center justify-center">
      {/* Primary gradient blob */}
      <Parallax
        strength={200}
        className="absolute inset-0"
        renderLayer={(percentage) => (
          <div className="pointer-events-none absolute inset-0 h-screen w-screen">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.3, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute -left-[20%] top-[5%] h-[70vh] w-[70vh] rounded-full bg-gradient-to-br from-[#0062FF]/30 to-blue-600/10 blur-3xl"
              style={{
                transform: `translate3d(${percentage * 100}px, ${percentage * -50}px, 0)`,
              }}
            />
          </div>
        )}
      >
        <div className="h-screen" />
      </Parallax>

      {/* Secondary accent gradient */}
      <Parallax
        strength={100}
        className="absolute inset-0"
        renderLayer={(percentage) => (
          <div className="pointer-events-none absolute inset-0 h-screen w-screen">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.2, scale: 1 }}
              transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
              className="absolute bottom-[10%] right-[5%] h-[50vh] w-[50vh] rounded-full bg-gradient-to-tl from-blue-600/20 to-purple-400/10 blur-3xl"
              style={{
                transform: `translate3d(${percentage * -50}px, ${percentage * 30}px, 0)`,
              }}
            />
          </div>
        )}
      >
        <div className="h-screen" />
      </Parallax>

      {/* Ambient light effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />

      {/* Content container - Ensuring immediate visibility without scrolling */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-center w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ParallaxBackground;
