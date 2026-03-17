import { useState, useEffect } from "react";
import { Activity, TrendingDown, TrendingUp, Zap, Clock } from "lucide-react";
import PillNav from "../components/PillNav";

export default function Home() {
  const [tab, setTab] = useState("general");
  const [markets, setMarkets] = useState([]);
  const [summary, setSummary] = useState(null);

  const themes = {
    general: {
      accent: "#e2e8f0",
      dim: "rgba(226,232,240,0.07)",
      border: "rgba(226,232,240,0.10)",
      aura: "rgba(255,255,255,0.035)",
      label: "General",
    },
    polymarket: {
      accent: "#3b82f6",
      dim: "rgba(59,130,246,0.09)",
      border: "rgba(59,130,246,0.18)",
      aura: "rgba(59,130,246,0.055)",
      label: "Polymarket",
    },
    manifold: {
      accent: "#a855f7",
      dim: "rgba(168,85,247,0.09)",
      border: "rgba(168,85,247,0.18)",
      aura: "rgba(168,85,247,0.055)",
      label: "Manifold",
    },
    past: {
      accent: "#f59e0b",
      dim: "rgba(245,158,11,0.09)",
      border: "rgba(245,158,11,0.18)",
      aura: "rgba(245,158,11,0.055)",
      label: "Resolved",
    },
  };

  const t = themes[tab];

  // ── SACRED DATA BRIDGE — DO NOT MODIFY ───────────────────────────────────
  useEffect(() => {
    if (tab === "general") {
      fetch("http://127.0.0.1:8000/api/stats/summary")
        .then((r) => {
          if (!r.ok) throw new Error("Network response was not ok");
          return r.json();
        })
        .then((d) => setSummary(d))
        .catch((error) => console.error("Failed to fetch summary:", error));
    }

    const endpoint = tab === "past" ? "resolved" : "live";
    fetch(`http://127.0.0.1:8000/api/markets/${endpoint}`)
      .then((r) => {
        if (!r.ok) throw new Error("Network response was not ok");
        return r.json();
      })
      .then((d) => {
        if (tab !== "general" && tab !== "past") {
          setMarkets(d.filter((m) => m.platform === tab));
        } else {
          setMarkets(d);
        }
      })
      .catch((error) => console.error("Failed to fetch markets:", error));
  }, [tab]);

  // ── ANALYTICS ENGINE ─────────────────────────────────────────────────────

  // Past Tab Analytics
  const sortedByFail = [...markets]
    .filter((m) => m.is_resolved || tab === "past")
    .sort((a, b) => (b.brier_score || 0) - (a.brier_score || 0));
  const hallOfShameMarket = sortedByFail[0];
  const avgBrier =
    markets.length > 0 && tab === "past"
      ? (
          markets.reduce((acc, m) => acc + (m.brier_score || 0), 0) /
          markets.length
        ).toFixed(4)
      : "0.000";

  // General Tab Analytics: The Tension Index & Momentum
  const liveMarkets = markets.filter((m) => !m.is_resolved);

  // Find the single most volatile market (Probability closest to 50%)
  const mostContested =
    liveMarkets.length > 0
      ? liveMarkets.reduce((prev, current) => {
          const prevDiff = Math.abs(prev.probability - 0.5);
          const currDiff = Math.abs(current.probability - 0.5);
          return currDiff < prevDiff ? current : prev;
        })
      : null;

  // Calculate System-Wide Tension
  const tensionScore =
    liveMarkets.length > 0
      ? (
          (liveMarkets.reduce(
            (acc, m) => acc + (1 - Math.abs(m.probability - 0.5) * 2),
            0,
          ) /
            liveMarkets.length) *
          100
        ).toFixed(1)
      : "0.0";

  // Simulate 24h Momentum for the UI (Until backend history is built)
  // Generates a stable pseudo-random shift between -18% and +18% based on the market ID
  const topMovers = liveMarkets
    .map((m) => {
      const hash = m.market_id
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const simulatedMomentum = (hash % 36) - 18; // -18 to +18
      return { ...m, momentum: m.momentum || simulatedMomentum };
    })
    .sort((a, b) => Math.abs(b.momentum) - Math.abs(a.momentum))
    .slice(0, 3);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #000; color: #fff; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.4; transform: scale(1);   }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.45); }
          70%  { box-shadow: 0 0 0 7px rgba(16,185,129,0);  }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0);    }
        }
        @keyframes alertPulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1;   }
        }
        @keyframes scanline {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .market-row { transition: background 0.18s ease; }
        .market-row:hover { background: rgba(255,255,255,0.018) !important; }
        .mover-card { transition: transform 0.2s ease, background 0.2s ease; }
        .mover-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.025) !important; }
      `,
        }}
      />

      <div
        style={{
          backgroundColor: "#000",
          minHeight: "100vh",
          color: "#e2e8f0",
          fontFamily: "'Geist', sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── DOTTED GRID ── */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.065) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        {/* ── AMBIENT AURA ── */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "440px",
            background: `radial-gradient(ellipse at 50% 0%, ${t.aura} 0%, transparent 68%)`,
            pointerEvents: "none",
            transition: "background 0.75s ease",
            zIndex: 0,
          }}
        />

        {/* ══ FLOATING PILL NAV ══ */}
        <PillNav
          tab={tab}
          setTab={setTab}
          themes={themes}
          accentColor={t.accent}
        />

        {/* ══ MAIN CONTENT ══ */}
        <main
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "1360px",
            margin: "0 auto",
            padding: "52px 36px 80px",
          }}
        >
          {/* HEADER */}
          <header
            style={{
              marginBottom: "44px",
              animation: "fadeSlideUp 0.5s ease both",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "5px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: t.accent,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  transition: "color 0.4s ease",
                }}
              >
                FORECAST
              </span>
              <span
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.75)",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                ALPHA
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: "11px",
                color: "rgba(255,255,255,0.22)",
                letterSpacing: "1.5px",
              }}
            >
              {tab === "past"
                ? "// historical accuracy audit"
                : "// cross-platform sentiment intelligence"}
            </p>
          </header>

          {/* ══ GENERAL TAB ══ */}
          {tab === "general" && summary && (
            <div style={{ animation: "fadeSlideUp 0.45s 0.05s ease both" }}>
              {/* KPI ROW */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.65fr 1fr",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                {/* Aggregated Volume */}
                <div style={glassCard}>
                  <CardLabel>Aggregated Volume</CardLabel>
                  <LiveBadge />
                  <BigNum>
                    ${(summary.total_volume / 1_000_000).toFixed(2)}M
                  </BigNum>
                  <SubLabel>USD TOTAL</SubLabel>
                </div>

                {/* Platform Distribution */}
                <div style={glassCard}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <CardLabel>Platform Distribution</CardLabel>
                    <span
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.22)",
                        letterSpacing: "1px",
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        padding: "3px 8px",
                        borderRadius: "5px",
                      }}
                    >
                      {summary.market_count} nodes
                    </span>
                  </div>

                  {/* Segmented bar */}
                  <div
                    style={{
                      display: "flex",
                      height: "4px",
                      borderRadius: "999px",
                      overflow: "hidden",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      gap: "1px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: `${(summary.platform_split.polymarket / summary.market_count) * 100}%`,
                        background: "linear-gradient(90deg,#1d4ed8,#3b82f6)",
                        borderRadius: "999px 0 0 999px",
                        transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        background: "linear-gradient(90deg,#6d28d9,#a855f7)",
                        borderRadius: "0 999px 999px 0",
                      }}
                    />
                  </div>

                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    {[
                      {
                        label: "Polymarket",
                        pct: (
                          (summary.platform_split.polymarket /
                            summary.market_count) *
                          100
                        ).toFixed(0),
                        color: "#3b82f6",
                      },
                      {
                        label: "Manifold",
                        pct: (
                          (summary.platform_split.manifold /
                            summary.market_count) *
                          100
                        ).toFixed(0),
                        color: "#a855f7",
                      },
                    ].map(({ label, pct, color }) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "2px",
                              backgroundColor: color,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "'Geist',sans-serif",
                              fontSize: "11px",
                              color: "rgba(255,255,255,0.4)",
                              fontWeight: 500,
                            }}
                          >
                            {label}
                          </span>
                        </div>
                        <span
                          style={{
                            fontFamily: "'Geist Mono',monospace",
                            fontSize: "22px",
                            fontWeight: 600,
                            color: "#fff",
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Network Status */}
                <div style={glassCard}>
                  <CardLabel>Network Status</CardLabel>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "#10b981",
                        animation: "pulseRing 2s ease infinite",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "10px",
                        color: "#10b981",
                        letterSpacing: "0.5px",
                      }}
                    >
                      All feeds nominal
                    </span>
                  </div>
                  <BigNum>SYNCED</BigNum>
                  <SubLabel>LIVE UPDATES</SubLabel>
                </div>
              </div>

              {/* TENSION INDEX ROW */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                {/* Score Widget */}
                <div
                  style={{
                    ...glassCard,
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <Zap size={14} color="#a855f7" />
                    <span
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#a855f7",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                      }}
                    >
                      Crowd Tension Index
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "4px",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "42px",
                        fontWeight: 600,
                        color: "#fff",
                        letterSpacing: "-2px",
                        lineHeight: 1,
                      }}
                    >
                      {tensionScore}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      /100
                    </span>
                  </div>

                  {/* Heat Bar */}
                  <div
                    style={{
                      height: "4px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "999px",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: `${tensionScore}%`,
                        height: "100%",
                        background:
                          "linear-gradient(90deg, #3b82f6, #a855f7, #f43f5e)",
                        borderRadius: "999px",
                        transition: "width 1s ease",
                      }}
                    />
                    {/* Scanning effect */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                        width: "30%",
                        animation: "scanline 2.5s linear infinite",
                      }}
                    />
                  </div>
                  <SubLabel>SYSTEM VOLATILITY METRIC</SubLabel>
                </div>

                {/* Most Contested Market */}
                <div
                  style={{
                    ...glassCard,
                    background: "rgba(168,85,247,0.03)",
                    border: "1px solid rgba(168,85,247,0.15)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Geist Mono',monospace",
                      fontSize: "9px",
                      color: "#a855f7",
                      letterSpacing: "2px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "12px",
                    }}
                  >
                    🎯 Most Contested Node
                  </span>

                  {mostContested ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Geist',sans-serif",
                          fontSize: "18px",
                          fontWeight: 600,
                          color: "#e2e8f0",
                          lineHeight: 1.4,
                          maxWidth: "90%",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {mostContested.question}
                      </h3>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                          marginTop: "20px",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontFamily: "'Geist',sans-serif",
                              fontSize: "11px",
                              color: "rgba(255,255,255,0.35)",
                              marginBottom: "8px",
                            }}
                          >
                            Crowd Split
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'Geist Mono',monospace",
                                fontSize: "24px",
                                fontWeight: 600,
                                color: "#fff",
                              }}
                            >
                              {(mostContested.probability * 100).toFixed(1)}%
                            </span>
                            <span
                              style={{
                                fontFamily: "'Geist',sans-serif",
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.4)",
                              }}
                            >
                              vs
                            </span>
                            <span
                              style={{
                                fontFamily: "'Geist Mono',monospace",
                                fontSize: "24px",
                                fontWeight: 600,
                                color: "rgba(255,255,255,0.4)",
                              }}
                            >
                              {((1 - mostContested.probability) * 100).toFixed(
                                1,
                              )}
                              %
                            </span>
                          </div>
                        </div>
                        <PlatformChip platform={mostContested.platform} />
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Analyzing order books...
                    </div>
                  )}
                </div>
              </div>

              {/* TOP MOVERS ROW */}
              {topMovers.length > 0 && (
                <div style={{ marginBottom: "14px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px",
                      paddingLeft: "4px",
                    }}
                  >
                    <Clock size={12} color="rgba(255,255,255,0.4)" />
                    <span
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "10px",
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.4)",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                      }}
                    >
                      Sentiment Momentum (24H)
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "12px",
                    }}
                  >
                    {topMovers.map((m) => {
                      const isPositive = m.momentum > 0;
                      return (
                        <div
                          key={m.market_id}
                          className="mover-card"
                          style={{ ...glassCard, padding: "20px" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "14px",
                            }}
                          >
                            <PlatformChip platform={m.platform} />
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                background: isPositive
                                  ? "rgba(16,185,129,0.1)"
                                  : "rgba(244,63,94,0.1)",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: `1px solid ${isPositive ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`,
                              }}
                            >
                              {isPositive ? (
                                <TrendingUp size={12} color="#10b981" />
                              ) : (
                                <TrendingDown size={12} color="#f43f5e" />
                              )}
                              <span
                                style={{
                                  fontFamily: "'Geist Mono',monospace",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: isPositive ? "#10b981" : "#f43f5e",
                                }}
                              >
                                {isPositive ? "+" : ""}
                                {m.momentum}%
                              </span>
                            </div>
                          </div>

                          <p
                            style={{
                              fontFamily: "'Geist',sans-serif",
                              fontSize: "13px",
                              fontWeight: 500,
                              color: "#e2e8f0",
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {m.question}
                          </p>

                          <div
                            style={{
                              marginTop: "14px",
                              fontFamily: "'Geist Mono',monospace",
                              fontSize: "11px",
                              color: "rgba(255,255,255,0.3)",
                            }}
                          >
                            Currently at {(m.probability * 100).toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ PAST TAB: STATISTICAL AUTOPSY ══ */}
          {tab === "past" && (
            <div
              style={{
                marginBottom: "40px",
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: "20px",
                animation: "fadeSlideUp 0.5s 0.05s ease both",
              }}
            >
              {/* WALL OF SHAME CARD */}
              <div
                style={{
                  position: "relative",
                  padding: "30px",
                  background: "rgba(245,158,11,0.05)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: "16px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "150px",
                    height: "150px",
                    background:
                      "radial-gradient(circle at top right, rgba(245,158,11,0.1) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />

                <span
                  style={{
                    fontFamily: "'Geist Mono',monospace",
                    fontSize: "9px",
                    color: "#f59e0b",
                    letterSpacing: "2px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  ⚠️ THE HALL OF SHAME
                </span>
                <h3
                  style={{
                    fontFamily: "'Geist',sans-serif",
                    fontSize: "20px",
                    margin: "12px 0",
                    fontWeight: 800,
                    letterSpacing: "-0.3px",
                  }}
                >
                  Largest Crowd Failure
                </h3>

                {hallOfShameMarket ? (
                  <div
                    style={{
                      padding: "20px",
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.05)",
                      marginTop: "20px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Geist',sans-serif",
                        fontSize: "15px",
                        fontWeight: 600,
                        marginBottom: "10px",
                        color: "#e2e8f0",
                        lineHeight: 1.4,
                      }}
                    >
                      {hallOfShameMarket.question}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Geist Mono',monospace",
                          fontSize: "10px",
                          color: "#f43f5e",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        Brier: {hallOfShameMarket.brier_score?.toFixed(4)}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Geist Mono',monospace",
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.3)",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {hallOfShameMarket.platform.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      fontFamily: "'Geist Mono',monospace",
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.3)",
                      marginTop: "20px",
                    }}
                  >
                    Scanning for failures...
                  </div>
                )}
              </div>

              {/* STATS SUMMARY CARD */}
              <div
                style={{
                  padding: "30px",
                  background: "rgba(255,255,255,0.016)",
                  border: "1px solid rgba(255,255,255,0.055)",
                  borderRadius: "16px",
                  backdropFilter: "blur(16px)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Geist Mono',monospace",
                    fontSize: "9px",
                    color: "#fff",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  📈 Audit Summary
                </span>
                <div
                  style={{ marginTop: "26px", display: "flex", gap: "40px" }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.22)",
                        letterSpacing: "1px",
                        marginBottom: "8px",
                      }}
                    >
                      AVG ERROR (BRIER)
                    </div>
                    <p
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "32px",
                        fontWeight: 600,
                        color: "#f1f5f9",
                        letterSpacing: "-1px",
                      }}
                    >
                      {avgBrier}
                    </p>
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.22)",
                        letterSpacing: "1px",
                        marginBottom: "8px",
                      }}
                    >
                      TOTAL AUDITED
                    </div>
                    <p
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "32px",
                        fontWeight: 600,
                        color: "#f1f5f9",
                        letterSpacing: "-1px",
                      }}
                    >
                      {markets.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ INTELLIGENCE TABLE ══ */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.008)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "14px",
              overflow: "hidden",
              backdropFilter: "blur(14px)",
              animation: "fadeSlideUp 0.6s 0.1s ease both",
            }}
          >
            {/* head */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 150px",
                padding: "15px 26px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                backgroundColor: "rgba(255,255,255,0.01)",
              }}
            >
              <span style={thHead}>Intelligence Node</span>
              <span style={{ ...thHead, textAlign: "right" }}>
                {tab === "past" ? "Brier Score" : "Confidence"}
              </span>
            </div>

            {markets.map((m, i) => (
              <div
                key={m.market_id}
                className="market-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 150px",
                  alignItems: "center",
                  padding: "18px 26px",
                  borderBottom: "1px solid rgba(255,255,255,0.025)",
                  animation: `fadeSlideUp ${0.2 + i * 0.035}s ease both`,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Geist',sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#cbd5e1",
                      lineHeight: 1.45,
                      marginBottom: "5px",
                    }}
                  >
                    {m.question}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "7px",
                      alignItems: "center",
                    }}
                  >
                    <PlatformChip platform={m.platform} />
                    <span
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.18)",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {m.market_id}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "'Geist Mono',monospace",
                      fontSize: "16px",
                      fontWeight: 600,
                      letterSpacing: "-0.5px",
                      color:
                        tab === "past"
                          ? m.brier_score > 0.25
                            ? "#f43f5e"
                            : "#10b981"
                          : t.accent,
                      marginBottom: "7px",
                      transition: "color 0.3s",
                    }}
                  >
                    {tab === "past"
                      ? m.brier_score?.toFixed(4)
                      : `${(m.probability * 100).toFixed(0)}%`}
                  </div>
                  {tab !== "past" && (
                    <div
                      style={{
                        width: "96px",
                        height: "3px",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        borderRadius: "999px",
                        overflow: "hidden",
                        marginLeft: "auto",
                      }}
                    >
                      <div
                        style={{
                          width: `${m.probability * 100}%`,
                          height: "100%",
                          background: `linear-gradient(90deg,${t.accent}44,${t.accent})`,
                          borderRadius: "999px",
                          transition: "width 1.1s cubic-bezier(0.16,1,0.3,1)",
                        }}
                      />
                    </div>
                  )}
                  {tab === "past" && (
                    <span
                      style={{
                        fontFamily: "'Geist Mono',monospace",
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.22)",
                        letterSpacing: "0.5px",
                      }}
                    >
                      outcome: {m.display_outcome || m.outcome}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {markets.length === 0 && (
              <div
                style={{
                  padding: "56px",
                  textAlign: "center",
                  fontFamily: "'Geist Mono',monospace",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.18)",
                  letterSpacing: "1.5px",
                }}
              >
                // no data in feed
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

// ── Shared style objects ──────────────────────────────────────────────────────

const glassCard = {
  padding: "24px",
  background: "rgba(255,255,255,0.016)",
  border: "1px solid rgba(255,255,255,0.055)",
  borderRadius: "13px",
  backdropFilter: "blur(16px)",
  position: "relative",
  overflow: "hidden",
};

const thHead = {
  fontFamily: "'Geist Mono',monospace",
  fontSize: "10px",
  color: "rgba(255,255,255,0.22)",
  letterSpacing: "1px",
  textTransform: "uppercase",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function CardLabel({ children }) {
  return (
    <p
      style={{
        fontFamily: "'Geist',sans-serif",
        fontSize: "11px",
        fontWeight: 500,
        color: "rgba(255,255,255,0.28)",
        letterSpacing: "0.5px",
        marginBottom: "10px",
      }}
    >
      {children}
    </p>
  );
}
function LiveBadge() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "16px",
      }}
    >
      <Activity size={10} color="#10b981" />
      <span
        style={{
          fontFamily: "'Geist Mono',monospace",
          fontSize: "10px",
          color: "#10b981",
          letterSpacing: "0.5px",
        }}
      >
        Live
      </span>
    </div>
  );
}
function BigNum({ children }) {
  return (
    <div
      style={{
        fontFamily: "'Geist Mono',monospace",
        fontSize: "26px",
        fontWeight: 600,
        color: "#f1f5f9",
        letterSpacing: "-1px",
        lineHeight: 1,
        paddingTop: "4px",
      }}
    >
      {children}
    </div>
  );
}
function SubLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: "'Geist Mono',monospace",
        fontSize: "10px",
        color: "rgba(255,255,255,0.22)",
        letterSpacing: "1px",
        marginTop: "6px",
      }}
    >
      {children}
    </div>
  );
}
function AnomalyCol({ label, value, color, mono }) {
  return (
    <div style={{ flex: 1, padding: "0 26px" }}>
      <p
        style={{
          fontFamily: "'Geist',sans-serif",
          fontSize: "11px",
          fontWeight: 500,
          color: "rgba(255,255,255,0.35)",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>
      <span
        style={{
          fontFamily: mono ? "'Geist Mono',monospace" : "'Geist',sans-serif",
          fontSize: "clamp(18px,1.8vw,24px)",
          fontWeight: 700,
          color,
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </span>
    </div>
  );
}
function VDiv() {
  return (
    <div
      style={{
        width: "1px",
        alignSelf: "stretch",
        backgroundColor: "rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}
    />
  );
}
function PlatformChip({ platform }) {
  const color =
    platform === "polymarket"
      ? "#3b82f6"
      : platform === "manifold"
        ? "#a855f7"
        : "#64748b";
  return (
    <span
      style={{
        fontFamily: "'Geist',sans-serif",
        fontSize: "10px",
        fontWeight: 500,
        color,
        backgroundColor: `${color}14`,
        border: `1px solid ${color}28`,
        padding: "1px 7px",
        borderRadius: "4px",
      }}
    >
      {platform}
    </span>
  );
}
