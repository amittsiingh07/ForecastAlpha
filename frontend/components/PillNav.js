import { useRef, useEffect } from "react";

/**
 * PillNav — Floating pill navigation with hover-circle fill animation
 * Place this file at: /components/PillNav.js
 * Import with: import PillNav from "../components/PillNav";
 */
export default function PillNav({ tab, setTab, themes, accentColor }) {
  const containerRef = useRef(null);
  const circleRef = useRef(null);

  // Move the hover-fill circle to the element under the pointer
  function moveCircle(el) {
    const circle = circleRef.current;
    if (!circle || !el) return;
    const rect = el.getBoundingClientRect();
    const navRect = containerRef.current.getBoundingClientRect();
    circle.style.left = `${rect.left - navRect.left + rect.width / 2}px`;
    circle.style.top = `${rect.top - navRect.top + rect.height / 2}px`;
    circle.style.width = `${rect.width + 8}px`;
    circle.style.height = `${rect.height + 8}px`;
    circle.style.opacity = "1";
  }

  function hideCircle() {
    if (circleRef.current) circleRef.current.style.opacity = "0";
  }

  // Always keep the circle on the active button without animation
  useEffect(() => {
    const nav = containerRef.current;
    if (!nav) return;
    const active = nav.querySelector("[data-active='true']");
    if (active) {
      const circle = circleRef.current;
      circle.style.transition = "none";
      moveCircle(active);
      // Re-enable transition after paint
      requestAnimationFrame(() => {
        circle.style.transition =
          "left 0.28s cubic-bezier(0.16,1,0.3,1), top 0.28s cubic-bezier(0.16,1,0.3,1), width 0.28s cubic-bezier(0.16,1,0.3,1), height 0.28s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease";
      });
    }
  }, [tab]);

  return (
    <>
      {/* THE FIX: using dangerouslySetInnerHTML to prevent HTML entity encoding */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes navDrop {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0);      }
        }

        .pill-btn {
          position: relative;
          z-index: 2;
          padding: 8px 22px;
          border-radius: 999px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: -0.1px;
          transition: color 0.22s ease;
          white-space: nowrap;
          outline: none;
        }
        .pill-btn:focus-visible {
          box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
        }
      `,
        }}
      />

      <div
        style={{
          position: "sticky",
          top: "20px",
          zIndex: 100,
          display: "flex",
          justifyContent: "center",
          width: "100%",
          boxSizing: "border-box",
          padding: "0 36px",
          animation: "navDrop 0.5s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <div
          ref={containerRef}
          onMouseLeave={hideCircle}
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: "2px",
            backgroundColor: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "999px",
            padding: "5px",
            backdropFilter: "blur(24px)",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.03)",
          }}
        >
          {/* Logo pill */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginRight: "4px",
              zIndex: 2,
              position: "relative",
            }}
          >
            <span
              style={{
                fontFamily: "'Geist Mono',monospace",
                fontSize: "14px",
                fontWeight: 600,
                color: "#fff",
              }}
            >
              Φ
            </span>
          </div>

          {/* Hover-fill circle — sits behind buttons */}
          <div
            ref={circleRef}
            style={{
              position: "absolute",
              borderRadius: "999px",
              backgroundColor: "rgba(255,255,255,0.09)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 1,
              opacity: 0,
              width: "80px",
              height: "36px",
              transition:
                "left 0.28s cubic-bezier(0.16,1,0.3,1), top 0.28s cubic-bezier(0.16,1,0.3,1), width 0.28s cubic-bezier(0.16,1,0.3,1), height 0.28s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease",
            }}
          />

          {/* Tab buttons */}
          {Object.entries(themes).map(([key, theme]) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                data-active={isActive}
                className="pill-btn"
                onClick={() => setTab(key)}
                onMouseEnter={(e) => moveCircle(e.currentTarget)}
                style={{
                  color: isActive ? "#000" : "rgba(255,255,255,0.45)",
                  backgroundColor: isActive ? "#ffffff" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
                  transition:
                    "color 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease",
                }}
              >
                {theme.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
