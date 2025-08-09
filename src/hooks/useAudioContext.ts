import { useEffect, useRef } from "react";

export const useAudioContext = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();

    // Resume audio context on first user interaction
    const resumeAudioContext = async () => {
      if (
        audioContextRef.current &&
        audioContextRef.current.state === "suspended"
      ) {
        try {
          await audioContextRef.current.resume();
        } catch (error) {
          // Silent error handling
        }
      }
    };

    // Add event listeners for user interaction
    const events = ["click", "touchstart", "keydown", "mousedown", "mousemove"];
    events.forEach((event) => {
      document.addEventListener(event, resumeAudioContext, { once: true });
    });

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      events.forEach((event) => {
        document.removeEventListener(event, resumeAudioContext);
      });
    };
  }, []);

  const playNodeSound = async (node: { glitchIntensity: number }) => {
    if (!audioContextRef.current) return;

    // Resume audio context if suspended
    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        return;
      }
    }

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Create glitchy sound based on node properties
      const baseFreq = 200 + node.glitchIntensity * 400;
      oscillator.frequency.setValueAtTime(
        baseFreq,
        audioContextRef.current.currentTime
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        baseFreq * (1 + node.glitchIntensity * 0.5),
        audioContextRef.current.currentTime + 0.1
      );

      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + 0.3
      );

      oscillator.type = "sine";
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.3);
    } catch (error) {
      // Silent error handling
    }
  };

  return { playNodeSound };
};
