import React from "react";
import { createRoot } from "react-dom/client";
import PKMApp from "./PKMApp";

// Loading component with pulsing neuron
const LoadingNeuron = () => {
  const [pulse, setPulse] = React.useState(0);

  React.useEffect(() => {
    let animationId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      setPulse(Math.sin(elapsed * 3) * 0.3 + 0.7);
      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
      },
    },
    // Neuron container
    React.createElement(
      "div",
      {
        style: {
          position: "relative",
          width: "200px",
          height: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      // Outer glow
      React.createElement("div", {
        style: {
          position: "absolute",
          width: `${120 + pulse * 40}px`,
          height: `${120 + pulse * 40}px`,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0, 255, 255, ${
            0.3 + pulse * 0.2
          }) 0%, rgba(0, 255, 136, ${0.2 + pulse * 0.1}) 50%, transparent 70%)`,
          animation: "pulse 2s ease-in-out infinite",
        },
      }),
      // Core neuron
      React.createElement("div", {
        style: {
          position: "absolute",
          width: `${40 + pulse * 20}px`,
          height: `${40 + pulse * 20}px`,
          borderRadius: "50%",
          backgroundColor: "#00ffff",
          boxShadow: `0 0 ${20 + pulse * 10}px rgba(0, 255, 255, 0.8)`,
        },
      }),
      // Wireframe ring
      React.createElement("div", {
        style: {
          position: "absolute",
          width: `${60 + pulse * 25}px`,
          height: `${60 + pulse * 25}px`,
          borderRadius: "50%",
          border: "1px solid #00ffff",
          opacity: 0.6,
        },
      })
    ),
    // Loading text
    React.createElement(
      "div",
      {
        style: {
          marginTop: "40px",
          color: "#00ffff",
          fontSize: "18px",
          opacity: 0.8,
          textAlign: "center",
        },
      },
      "INITIALIZING FLOPPY NEURONS..."
    ),
    React.createElement(
      "div",
      {
        style: {
          marginTop: "10px",
          color: "#00ff88",
          fontSize: "12px",
          opacity: 0.6,
          textAlign: "center",
        },
      },
      "Loading memory visualization..."
    )
  );
};

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM loaded, attempting to mount React...");
  // Debug: verify preload exposed API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = (window as any).electronAPI;
  console.log(
    "preload window.electronAPI present:",
    !!api,
    api && Object.keys(api)
  );

  // Mount React PKM application
  const rootElement = document.getElementById("root");
  console.log("Root element found:", rootElement);

  if (rootElement) {
    try {
      const root = createRoot(rootElement);
      console.log("React root created, rendering...");

      // First show loading neuron
      root.render(React.createElement(LoadingNeuron));

      // After a delay, load the actual PKM app
      setTimeout(() => {
        console.log("Loading PKM app...");
        try {
          root.render(React.createElement(PKMApp));
        } catch (error) {
          console.error("Error loading PKMApp:", error);
          // Fallback to simple message
          root.render(
            React.createElement(
              "div",
              {
                style: { color: "white", padding: "20px", background: "black" },
              },
              "PKMApp failed to load: " + String(error)
            )
          );
        }
      }, 2000);
    } catch (error) {
      console.error("Error mounting React:", error);
      // Fallback to basic HTML
      rootElement.innerHTML =
        '<div style="color: white; padding: 20px;">Error loading PKM app: ' +
        (error instanceof Error ? error.message : String(error)) +
        "</div>";
    }
  } else {
    console.error("Root element not found!");
  }
});
