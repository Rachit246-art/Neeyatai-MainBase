import { useState, useEffect } from "react";
import {
  Typography,
  IconButton,
  Box,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Close as CloseIcon,
  AssignmentTurnedIn,
  PlayCircle,
  Assessment,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";
import axiosInstance from "../api/axiosInstance";
import { clamp } from "framer-motion";

// Simulate fetching from backend (replace this with real fetch later)
const fetchBackendMetrics = async () => {
  try {
    const res = await axiosInstance.get("/user-metrics");
    return res.data;
  } catch (err) {
    console.warn("Backend not reachable. Using fallback values.");
    return {
      total_test_plans_generated: 0,
      total_tests_run: 0,
      total_analysis_reports: 0,
      total_test_plans_pct_change: 0,
      total_tests_run_pct_change: 0,
      total_analysis_reports_pct_change: 0,
    };
  }
};

// Progress Circle Component
const ProgressCircle = ({ percentage, size = 60, strokeWidth = 4, color = "#FF6D00" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 109, 0, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out',
          }}
        />
      </svg>
      <Box sx={{
        position: 'absolute',
        fontSize: '12px',
        fontWeight: '700',
        color: color,
        transform: 'rotate(90deg)',
      }}>
        {percentage}%
      </Box>
    </Box>
  );
};

// Mini Trend Chart Component
const MiniTrendChart = ({ data, color = "#FF6D00", height = 40 }) => {
  if (!data || data.length < 2) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Box sx={{ width: '100%', height: height }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(255, 109, 0, 0.2))',
          }}
        />
        {/* Gradient fill */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon
          fill={`url(#gradient-${color.replace('#', '')})`}
          points={`0,100 ${points} 100,100`}
        />
      </svg>
    </Box>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(value * easeOutQuart));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <Typography
      variant="h3"
      sx={{
        fontWeight: "800",
        marginBottom: "6px",
        fontSize: "22px",
        letterSpacing: "0.5px",
        color: "#333333",
        transition: "all 0.3s ease",
      }}
    >
      {displayValue.toLocaleString()}
    </Typography>
  );
};

// Sparkline Bar Chart Component
const SparklineBarChart = ({ data, color = "#FF6D00", height = 30 }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data);
  const barWidth = 100 / data.length;

  return (
    <Box sx={{ width: '100%', height: height, display: 'flex', alignItems: 'end', gap: '2px' }}>
      {data.map((value, index) => (
        <Box
          key={index}
          sx={{
            flex: 1,
            height: `${(value / maxValue) * 100}%`,
            backgroundColor: color,
            borderRadius: '2px 2px 0 0',
            minHeight: '4px',
            transition: 'all 0.3s ease',
            opacity: 0.7,
            '&:hover': {
              opacity: 1,
              transform: 'scaleY(1.1)',
            },
          }}
        />
      ))}
    </Box>
  );
};

const Dashboard = () => {
  const [cards, setCards] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const loadMetrics = async () => {
      const data = await fetchBackendMetrics();

      const makeInfoText = (current, last) => {
        if (last === 0 && current === 0) return "No activity yet";
        if (last === 0 && current > 0) return "New activity this month";
        if (current === 0 && last > 0) return "100% down from last month";
        const percentChange = ((current - last) / last) * 100;
        if (percentChange >= 100) {
          const multiplier = (current / last).toFixed(1);
          return `${multiplier}x growth from last month`;
        }
        const isUp = percentChange > 0;
        return `${Math.abs(percentChange).toFixed(2)}% ${isUp ? "up" : "down"} from last month`;
      };

      // Generate sample trend data for visualization
      const generateTrendData = (current, last) => {
        const base = Math.max(current, last, 1);
        return Array.from({ length: 7 }, (_, i) => {
          const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
          return Math.floor(base * randomFactor * (i + 1) / 7);
        });
      };

      const newCards = [
        {
          id: 1,
          title: "Total Test Plans Generated",
          value: data.total_test_plans_generated || 0,
          info: makeInfoText(data.total_test_plans_this_month, data.total_test_plans_last_month),
          icon: <AssignmentTurnedIn fontSize="large" />,
          color: "#FF6D00",
        },
        {
          id: 2,
          title: "Total Tests Run",
          value: data.total_tests_run || 0,
          info: makeInfoText(data.total_tests_run_this_month, data.total_tests_run_last_month),
          icon: <PlayCircle fontSize="large" />,
          color: "#4CAF50",
        },
        {
          id: 3,
          title: "Intelligent Analysis Reports",
          value: data.total_analysis_reports || 0,
          info: makeInfoText(data.total_analysis_reports_this_month, data.total_analysis_reports_last_month),
          icon: <Assessment fontSize="large" />,
          color: "#2196F3",
        },
      ];

      setCards(newCards);
      setChartData([
        {
          label: "Test Plans Generated",
          color: "#FF6D00",
          data: generateTrendData(data.total_test_plans_this_month || 0, data.total_test_plans_last_month || 0),
        },
        {
          label: "Tests Run",
          color: "#4CAF50",
          data: generateTrendData(data.total_tests_run_this_month || 0, data.total_tests_run_last_month || 0),
        },
        {
          label: "Analysis Reports",
          color: "#2196F3",
          data: generateTrendData(data.total_analysis_reports_this_month || 0, data.total_analysis_reports_last_month || 0),
        },
      ]);
    };
    loadMetrics();
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const sidebarWidth = sidebarOpen || sidebarHovered ? 280 : 70;

  return (
    <>
      <div className="w-full max-w-full flex-1 m-0 px-[clamp(4px,2vw,24px)] pt-[clamp(16px,4vw,32px)] pb-[clamp(24px,4vw,40px)] box-border min-h-screen flex flex-col overflow-x-auto relative">
        <div className="w-full relative z-[1] mb-[clamp(0px,1vw,32px)] bg-transparent rounded-[var(--tp-radius)] text-[var(--tp-orange-dark)] px-[clamp(8px,4vw,32px)] pt-[clamp(18px,5vw,40px)] pb-[clamp(12px,3vw,32px)] box-border">


          <div className="text-[clamp(1.5rem,7vw,2.2rem)] font-extrabold tracking-[0.5px] text-[var(--tp-orange-dark)] break-words max-w-full">
            Dashboard
          </div>

          <div className="text-[clamp(1rem,3vw,1.2rem)] ml-1 font-bold text-[var(--tp-text)] opacity-85 break-words whitespace-normal">
            Welcome to Dynamic Admin
          </div>

        </div>
        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(8px, 0.5vw, 16px)',
          width: '100%',
          boxSizing: 'border-box',
          marginTop:'-10px',
          padding: 'clamp(4px, 2vw, 16px)',
          paddingLeft: 'clamp(12px, 2vw, 24px)', // ⬅️ Increased left padding
          overflowX: 'auto',
          alignItems: 'stretch',
        }}>

          {cards.map((card) => (
            <Card
              key={card.id}
              className="card-transition"
              sx={{
                background: 'linear-gradient(135deg, #fff 0%, #fff 100%)',
                backdropFilter: 'blur(80px)',
                border: '1px solid rgba(255, 126, 95, 0.2)',
                borderRadius: '16px',
                minWidth: 0,
                width: '95%',
                height: 'clamp(120px, 18vw, 170px)',
                boxShadow: '0 2px 8px rgba(255, 153, 102, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                animation: 'fadeIn 0.7s ease',
                '&:hover': {
                  transform: 'scale(1.01) translateY(-2px)',
                  boxShadow: '0 6px 18px rgba(255, 153, 102, 0.18)',
                },
              }}
            >
              <CardContent
                sx={{
                  padding: "clamp(8px, 2vw, 16px)",
                  height: "100%",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "12px",
                    marginTop: "4px",
                  }}
                >
                  <Box
                    sx={{
                      background: "rgba(255, 109, 0, 0.08)",
                      borderRadius: "10px",
                      padding: "8px",
                      flexShrink: 0,
                      boxShadow: "0 2px 6px rgba(255, 109, 0, 0.08)",
                      transition: "transform 0.3s ease",
                      "&:hover": {
                        transform: "rotate(10deg) scale(1.08)",
                      },
                    }}
                  >
                    <Box sx={{ fontSize: "22px", color: card.color }}>
                      {card.icon}
                    </Box>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: "clamp(0.95rem, 1.2vw, 1.08rem)",
                      fontWeight: "700",
                      lineHeight: "1.2",
                      flex: 1,
                      minWidth: 0,
                      overflow: "visible",
                      textOverflow: "unset",
                      letterSpacing: "0.2px",
                      color: card.color,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      display: "block",
                    }}
                  >
                    {card.title}
                  </Typography>
                </Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: "800",
                    marginBottom: "6px",
                    fontSize: "22px",
                    letterSpacing: "0.5px",
                    color: "#333333",
                  }}
                >
                  {card.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.92,
                    fontSize: "12px",
                    fontWeight: "500",
                    letterSpacing: "0.1px",
                    color: "#666666",
                  }}
                >
                  {card.info}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Graphs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'clamp(8px, 1vw, 16px)',
          width: '100%',
          boxSizing: 'border-box',
          paddingTop: '0px',
          padding: 'clamp(4px, 2vw, 16px)',
          paddingLeft: 'clamp(12px, 2vw, 24px)',
          marginTop: '8px',
        }}>
          {chartData.map((chart, idx) => (
            <Box
              key={idx}
              sx={{
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: '220px',
                transition: 'box-shadow 0.2s, transform 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.01) translateY(-2px)',
                  boxShadow: '0 6px 18px rgba(255, 153, 102, 0.18)',
                },
              }}
            >
              <Typography variant="h6" sx={{ color: chart.color, fontWeight: 700, marginBottom: 2 }}>{chart.label} (Last 7 Days)</Typography>
              <MiniTrendChart data={chart.data} color={chart.color} height={80} />
              <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
                {chart.data.map((val, i) => (
                  <Box key={i} sx={{ fontSize: 12, color: '#888', minWidth: 18, textAlign: 'center' }}>{val}</Box>
                ))}
              </Box>
            </Box>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
          
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .card-transition {
          animation: slideInUp 0.6s ease-out;
        }
        
        .card-transition:nth-child(1) { animation-delay: 0.1s; }
        .card-transition:nth-child(2) { animation-delay: 0.2s; }
        .card-transition:nth-child(3) { animation-delay: 0.3s; }
        
        @media (max-width: 1024px) {
          .MuiGrid-container {
            row-gap: clamp(16px, 2vw, 24px) !important;
            column-gap: clamp(16px, 2vw, 24px) !important;
          }
          .MuiGrid-item {
            max-width: 100vw !important;
            min-width: 0 !important;
          }
        }
        @media (max-width: 900px) {
          .MuiTypography-h6 {
            white-space: normal !important;
            text-overflow: unset !important;
            word-break: break-word !important;
          }
          .MuiGrid-container {
            row-gap: clamp(12px, 2vw, 16px) !important;
            column-gap: clamp(12px, 2vw, 16px) !important;
          }
          .MuiGrid-item {
            max-width: 100vw !important;
            min-width: 0 !important;
          }
        }
        @media (max-width: 600px) {
          main {
            padding: clamp(8px, 2vw, 16px) clamp(2px, 2vw, 8px) clamp(16px, 4vw, 32px) clamp(2px, 2vw, 8px) !important;
          }
          .MuiGrid-container {
            row-gap: clamp(8px, 2vw, 12px) !important;
            column-gap: clamp(8px, 2vw, 12px) !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .MuiGrid-item {
            max-width: 100vw !important;
            min-width: 0 !important;
            width: 95% !important;
            margin: 0 auto clamp(12px, 2vw, 20px) auto !important;
          }
          .MuiCard-root {
            width: 100% !important;
            max-width: 100vw !important;
            min-width: 0 !important;
            padding: clamp(8px, 2vw, 14px) !important;
          }
          .MuiCardContent-root {
            padding: clamp(12px, 2vw, 16px) !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 180px !important;
          }
          .MuiTypography-h6, .MuiTypography-h3, .MuiTypography-body2 {
            font-size: clamp(0.9rem, 4vw, 1.1rem) !important;
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            text-align: center !important;
          }
          .MuiTypography-h3 {
            font-size: clamp(1.1rem, 6vw, 1.5rem) !important;
          }
          .MuiSvgIcon-root, .MuiBox-root[style*='font-size'] {
            font-size: clamp(1.2rem, 8vw, 2.2rem) !important;
          }
        }
        @media (max-width: 480px) {
          main {
            padding: clamp(6px, 2vw, 10px) clamp(1px, 2vw, 4px) clamp(12px, 4vw, 24px) clamp(1px, 2vw, 4px) !important;
          }
          .MuiGrid-container {
            row-gap: clamp(6px, 2vw, 8px) !important;
            column-gap: clamp(6px, 2vw, 8px) !important;
          }
          .MuiGrid-item {
            max-width: 100vw !important;
            min-width: 0 !important;
          }
        }
        @media (max-width: 900px) {
          .MuiTypography-h6 {
            white-space: normal !important;
            text-overflow: unset !important;
            word-break: break-word !important;
          }
        }
      `}</style>
    </>
  );
};

export default Dashboard;
