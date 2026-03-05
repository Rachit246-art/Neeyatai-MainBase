
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Zap, Check, Shield, Headphones, ArrowRight, CreditCard, DollarSign } from 'lucide-react';
import { Typography } from '@mui/material';


const currenciesWithRates = [
  { code: "INR", rate: 1 },
  { code: "USD", rate: 0.0116 },
  { code: "EUR", rate: 0.0101 },
  { code: "GBP", rate: 0.0086 },
  { code: "AUD", rate: 0.0179 },
  { code: "CAD", rate: 0.0158 },
  { code: "SGD", rate: 0.0149 },
  { code: "CHF", rate: 0.0094 },
  { code: "JPY", rate: 1.6789 },
  { code: "CNY", rate: 0.0833 },
  { code: "SAR", rate: 0.0435 },
  { code: "AED", rate: 0.0426 },
  { code: "HKD", rate: 0.0911 },
  { code: "MYR", rate: 0.0493 },
  { code: "QAR", rate: 0.0422 },
  { code: "THB", rate: 0.3763 },
  { code: "ZAR", rate: 0.2085 },
  { code: "BHD", rate: 0.0093 },
  { code: "KRW", rate: 13.45 },
  { code: "SEK", rate: 0.112 },
  { code: "DKK", rate: 0.0758 },
  { code: "NOK", rate: 0.107 },
  { code: "RUB", rate: 1.12 },
  { code: "MXN", rate: 0.198 },
  { code: "BRL", rate: 0.058 },
  { code: "PHP", rate: 0.65 },
  { code: "IDR", rate: 178.45 },
  { code: "TRY", rate: 0.35 },
  { code: "PLN", rate: 0.045 },
  { code: "VND", rate: 275.0 }
];

const features = [
  { icon: <Zap />, title: "Unlimited Tests", description: "Run as many tests as you need without any restrictions." },
  { icon: <Check />, title: "Advanced Analytics", description: "Dive deep into performance metrics with detailed reports." },

  { icon: <CreditCard />, title: "Multiple Payment Methods", description: "Pay with credit card, PayPal, or cryptocurrency." },
  { icon: <DollarSign />, title: "Cost Savings", description: "Save up to 40% compared to other performance testing tools." },
];

function PaymentPage() {
  const [months, setMonths] = useState(1);
  const [currency, setCurrency] = useState("INR");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [basePrice, setBasePrice] = useState(40000);
  const [discountedPrice, setDiscountedPrice] = useState(25000);
  const [totalPrice, setTotalPrice] = useState(25000);


  const sidebarWidth = sidebarOpen || sidebarHovered ? 280 : 70;
  const basePricePerMonthINR = 40000;
  const discountedPricePerMonthINR = 25000;
  const navigate = useNavigate();


  useEffect(() => {
    const selected = currenciesWithRates.find(c => c.code === currency);
    if (selected) {
      const base = Math.round(basePricePerMonthINR * selected.rate);
      const discounted = Math.round(discountedPricePerMonthINR * selected.rate);

      setBasePrice(base);
      setDiscountedPrice(discounted);
      setTotalPrice(discounted * months);
    }
  }, [currency, months]);

  const handleGetPro = async () => {
    try {
      const payload = {
        months,
        currency,
        promo_code: promoCode?.trim() || ""
      };

      const res = await axiosInstance.post("/payments/create-order", payload);
      const order = res.data;

      // ✅ Handle Free Promo Code (100% Discount)
      if (order.is_free) {
        await axiosInstance.post("/payments/verify-payment", {
          razorpay_order_id: order.id, // Starts with "free_promo_"
          razorpay_payment_id: "free_bypass",
          razorpay_signature: "free_bypass",
          months,
          currency,
          promo_code: promoCode?.trim() || ""
        });

        localStorage.setItem("kickload_last_payment", JSON.stringify({
          payment_id: "free_" + new Date().getTime(),
          months,
          currency,
          promo_code: promoCode?.trim() || "",
          date: new Date().toISOString()
        }));

        navigate("/dashboard");
        return;
      }

      if (!window.Razorpay) {
        alert("Razorpay is not loaded. Please refresh and try again.");
        return;
      }

      const options = {
        key: import.meta.env.VITE_APP_RAZORPAY_KEY,
        amount: order.final_price,
        currency: order.currency,
        name: "NeeyatAI", // ✅ Updated name
        description: `${months}-month subscription`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await axiosInstance.post("/payments/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              months,
              currency,
              promo_code: promoCode?.trim() || "" // ✅ Send promo code to backend
            });

            localStorage.setItem("kickload_last_payment", JSON.stringify({
              payment_id: response.razorpay_payment_id,
              months,
              currency,
              promo_code: promoCode?.trim() || "",
              date: new Date().toISOString()
            }));

            // ✅ Redirect to dashboard
            navigate("/dashboard");
          } catch (err) {
            console.error("Verification failed:", err);
            alert("❌ Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: "" // Optionally populate with logged-in user's email
        },
        theme: {
          color: "#FF6D00"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert(error?.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      overflow: 'hidden',
      fontFamily: "'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif"
    }}>
      {/* Main Content Wrapper */}
      <div style={{
        flex: 1,
        marginLeft: 0,
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Content Container */}
        <main className="payment-main-content">
          {/* Header Section with consistent styling */}
          <div style={{ marginTop: 0, paddingLeft: "clamp(10px, 3vw, 48px)", padding: "32px", width: "100%", boxSizing: "border-box", position: "relative" }}>
            <Typography
              variant="h3"
              className="main-page-heading"
              style={{
                fontSize: "clamp(1.5rem, 7vw, 2.2rem)",
                fontWeight: "900",
                color: "#FF6D00",
                letterSpacing: "0.5px",
                whiteSpace: 'normal',
                overflowWrap: 'break-word',
                marginLeft: 0,
                marginBottom: '8px',
              }}
            >
              Premium Plan
            </Typography>
            <Typography
              variant="h6"
              style={{
                fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                fontWeight: '550',
                fontStyle: 'bold',
                opacity: '0.85',
                color: '#333333',
                whiteSpace: 'normal',
                overflowWrap: 'break-word',
                marginLeft: 0,
                marginTop: '0px',
                marginBottom: '0px',
              }}
            >
              Unlock all features with our premium plan
            </Typography>
          </div>

          {/* Currency Selector */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '20px',
            maxWidth: '480px',
            margin: '0 auto 20px'
          }}>
            <label style={{
              marginRight: '10px',
              color: '#333',
              fontWeight: '500',
              fontSize: '14px'
            }}>Currency:</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 109, 0, 0.3)',
                background: 'rgba(255, 255, 255, 0.8)',
                color: '#333',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}
            >
              {currenciesWithRates.map((curr) => (
                <option key={curr.code} value={curr.code}>{curr.code}</option>
              ))}
            </select>
          </div>

          {/* Main Content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
            maxWidth: '1200px',
            margin: '0',
            padding: '0 20px'
          }}>
            {/* Enhanced Pricing Card */}
            <div style={{
              background: "linear-gradient(135deg, rgba(255, 126, 95, 0.15) 0%, rgba(254, 180, 123, 0.15) 100%)",
              backdropFilter: "blur(80px)",
              border: "1px solid rgba(255, 126, 95, 0.2)",
              borderRadius: "20px",
              padding: "32px",
              boxShadow: "0 4px 12px rgba(255, 153, 102, 0.1)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
              maxWidth: "560px",
              margin: "0 auto",
              width: "100%",
              animation: "fadeInUp 0.8s ease-out"
            }}>
              {/* Static border instead of animated gradient */}
              <div style={{
                position: "absolute",
                top: "-2px",
                left: "-2px",
                right: "-2px",
                bottom: "-2px",
                background: "rgba(255, 109, 0, 0.1)",
                borderRadius: "22px",
                zIndex: -1
              }} />

              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(90deg, #FF6D00 0%, #FF4E50 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                padding: '8px 16px',
                borderRadius: '20px',
                marginBottom: '24px',
                boxShadow: '0 4px 12px rgba(255, 109, 0, 0.3)',
                animation: 'bounce 0.6s ease-out'
              }}>
                🔥 Limited Time Offer!
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '24px',
                animation: 'slideInRight 0.6s ease-out'
              }}>
                <span style={{
                  fontSize: '24px',
                  color: '#666666',
                  textDecoration: 'line-through',
                  transition: 'all 0.3s ease'
                }}>
                  {currency} {basePrice.toLocaleString()}
                </span>
                <ArrowRight style={{
                  width: '20px',
                  height: '20px',
                  color: '#FF6D00',
                  animation: 'slideRight 1s ease infinite'
                }} />
                <span style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  color: '#FF6D00',
                  textShadow: '0 2px 4px rgba(255, 109, 0, 0.2)'
                }}>
                  {currency} {discountedPrice.toLocaleString()}
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  /month
                </span>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  color: '#333333',
                  fontWeight: '600',
                  marginBottom: '8px',
                  fontSize: '14px',
                  transition: 'color 0.3s ease'
                }}>
                  Number of Months <span style={{ color: '#FF6D00', fontWeight: 700, fontSize: 18 }}>
                    (Extra 5% off on 12 months or more)
                  </span>
                </label>
                <div style={{
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={months}
                    onChange={(e) => {
                      let value = parseInt(e.target.value);
                      if (isNaN(value)) value = 1;
                      setMonths(Math.min(12, Math.max(1, value)));
                    }}
                    onFocus={() => setFocusedInput('months')}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: `1px solid ${focusedInput === 'months' ? '#FF6D00' : 'rgba(255, 109, 0, 0.2)'}`,
                      borderRadius: '12px',
                      color: '#333333',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: focusedInput === 'months'
                        ? '0 0 0 3px rgba(255, 109, 0, 0.2)'
                        : '0 2px 4px rgba(255, 109, 0, 0.1)',
                      transform: focusedInput === 'months' ? 'translateY(-1px)' : 'none'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: '0',
                    fontSize: '12px',
                    color: '#666666',
                    opacity: focusedInput === 'months' ? 1 : 0,
                    transform: `translateY(${focusedInput === 'months' ? '0' : '-10px'})`,
                    transition: 'all 0.3s ease'
                  }}>
                    Enter a value between 1 and 12 months
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  color: '#333333',
                  fontWeight: '600',
                  marginBottom: '8px',
                  fontSize: '14px',
                  transition: 'color 0.3s ease'
                }}>
                  Promo Code (Optional)
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onFocus={() => setFocusedInput('promo')}
                  onBlur={() => setFocusedInput(null)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: `1px solid ${focusedInput === 'promo' ? '#FF6D00' : 'rgba(255, 109, 0, 0.2)'}`,
                    borderRadius: '12px',
                    color: '#333333',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: focusedInput === 'promo'
                      ? '0 0 0 3px rgba(255, 109, 0, 0.2)'
                      : '0 2px 4px rgba(255, 109, 0, 0.1)',
                    transform: focusedInput === 'promo' ? 'translateY(-1px)' : 'none'
                  }}
                  placeholder="Enter promo code if you have one"
                />
              </div>

              {months > 1 && (
                <div style={{
                  background: 'rgba(255, 109, 0, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px',
                  textAlign: 'center',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  <p style={{
                    color: '#666666',
                    fontSize: '14px',
                    margin: '0 0 4px 0'
                  }}>
                    Total for {months} months
                  </p>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#FF6D00',
                    margin: '0',
                    textShadow: '0 1px 2px rgba(255, 109, 0, 0.2)'
                  }}>
                    {currency} {totalPrice.toLocaleString()}
                  </p>
                </div>
              )}

              <button
                onClick={handleGetPro}
                style={{
                  width: '100%',
                  background: '#FF6D00',
                  color: 'white',
                  fontWeight: '600',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(255, 109, 0, 0.3)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <span style={{ position: 'relative', zIndex: 2 }}>
                  Get Pro Access
                </span>
                <ArrowRight style={{
                  width: '20px',
                  height: '20px',
                  position: 'relative',
                  zIndex: 2,
                  animation: 'bounceX 1s ease infinite'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '120%',
                  height: '120%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                  transform: 'translate(-50%, -50%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  zIndex: 1
                }} />
              </button>
            </div>

            {/* Enhanced Features Grid */}
            <div className="features-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              margin: '40px 0'
            }}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 126, 95, 0.15) 0%, rgba(254, 180, 123, 0.15) 100%)",
                    backdropFilter: "blur(80px)",
                    border: "1px solid rgba(255, 126, 95, 0.2)",
                    borderRadius: "20px",
                    padding: "28px",
                    height: "100%",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    animation: `fadeInUp 0.6s ease ${index * 0.1}s both`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.015)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 153, 102, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(255, 109, 0, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transition: 'all 0.6s ease',
                    transform: 'scale(0.8)',
                    opacity: 0.5
                  }} />
                  <div style={{
                    background: "rgba(255, 109, 0, 0.1)",
                    borderRadius: "16px",
                    padding: "16px",
                    width: "fit-content",
                    marginBottom: "20px",
                    color: "#FF6D00",
                    transition: "all 0.3s ease",
                    position: 'relative'
                  }}>
                    {feature.icon}
                  </div>
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#FF6D00",
                    marginBottom: "12px",
                    position: 'relative'
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    color: "#666666",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    margin: 0,
                    position: 'relative'
                  }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Enhanced Trust Indicators */}
            <div style={{
              background: "linear-gradient(135deg, rgba(255, 126, 95, 0.15) 0%, rgba(254, 180, 123, 0.15) 100%)",
              backdropFilter: "blur(80px)",
              border: "1px solid rgba(255, 126, 95, 0.2)",
              borderRadius: "20px",
              padding: "24px",
              marginBottom: "40px",
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #FF6D00, transparent)',
                animation: 'shimmer 2s infinite'
              }} />
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '40px'
              }}>
                {[
                  { icon: <Shield />, text: "SSL Secured" },
                  { icon: <Check />, text: "30-Day Money Back" },

                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      animation: `fadeInUp 0.6s ease ${index * 0.1}s both`
                    }}
                  >
                    <div style={{
                      background: "rgba(255, 109, 0, 0.1)",
                      borderRadius: "50%",
                      padding: "12px",
                      color: "#FF6D00",
                      transition: "all 0.3s ease",
                      transform: "scale(1)",
                      animation: `pulse 2s infinite ${index * 0.3}s`
                    }}>
                      {React.cloneElement(item.icon, { width: '24px', height: '24px' })}
                    </div>
                    <span style={{
                      color: "#333333",
                      fontSize: "16px",
                      fontWeight: "500",
                      position: 'relative'
                    }}>
                      {item.text}
                      <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        left: '0',
                        width: '0',
                        height: '2px',
                        background: '#FF6D00',
                        transition: 'width 0.3s ease'
                      }} />
                    </span>
                  </div>
                ))}
              </div>
            </div>


          </div>
        </main>
      </div>
      <style jsx global>{`
        body {
          background: linear-gradient(to bottom, #FFF8F1, #FFF1E6) !important;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        html {
          font-size: 16px;
        }
        *, *::before, *::after {
          box-sizing: border-box;
        }
        main, .main-content, .tp-main, .enhanced-bg {
          max-width: 100vw;
          overflow-x: hidden;
        }
        /* Enhanced Responsive Breakpoints */
        @media (max-width: 1400px) {
          main {
            max-width: 95vw !important;
            margin: 0 auto !important;
          }
          .pricing-card {
            max-width: clamp(480px, 80vw, 560px) !important;
          }
        }
        @media (max-width: 1200px) {
          main {
            max-width: 100vw !important;
            padding: clamp(16px, 3vw, 20px) !important;
          }
          .pricing-card {
            max-width: clamp(400px, 85vw, 520px) !important;
          }
          .features-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
            gap: clamp(16px, 3vw, 24px) !important;
          }
        }
        @media (max-width: 900px) {
          main {
            padding: clamp(12px, 4vw, 16px) !important;
          }
          .pricing-card {
            max-width: clamp(350px, 90vw, 480px) !important;
          }
          .features-grid {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
            gap: clamp(12px, 4vw, 20px) !important;
          }
        }
        @media (max-width: 768px) {
          main {
            padding: clamp(8px, 3vw, 12px) !important;
          }
          .pricing-card {
            max-width: clamp(300px, 95vw, 400px) !important;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
            gap: clamp(10px, 3vw, 16px) !important;
          }
          .trust-indicators {
            flex-direction: column !important;
            gap: clamp(16px, 4vw, 24px) !important;
          }
        }
        @media (max-width: 600px) {
          main {
            padding: clamp(6px, 2vw, 8px) !important;
            width: 100vw !important;
            max-width: 100vw !important;
          }
          .pricing-card {
            max-width: 100vw !important;
            width: 100% !important;
            margin: 0 auto clamp(16px, 2vw, 24px) auto !important;
            padding: clamp(12px, 2vw, 18px) !important;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .features-grid > div {
            width: 100% !important;
            max-width: 100vw !important;
            min-width: 0 !important;
            padding: clamp(10px, 2vw, 16px) !important;
            text-align: center !important;
            word-break: break-word !important;
            white-space: normal !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .features-grid h3, .features-grid p {
            text-align: center !important;
            white-space: normal !important;
            word-break: normal !important;
            overflow-wrap: anywhere !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto clamp(6px, 1vw, 12px) auto !important;
          }
          .features-grid h3 {
            font-size: clamp(1rem, 4vw, 1.2rem) !important;
          }
          .features-grid p {
            font-size: clamp(0.95rem, 3vw, 1.1rem) !important;
          }
          .trust-indicators {
            flex-direction: column !important;
            gap: clamp(12px, 3vw, 20px) !important;
            width: 100vw !important;
            max-width: 100vw !important;
            margin: 0 auto clamp(16px, 2vw, 24px) auto !important;
          }
          .trust-indicators > div {
            width: 100% !important;
            max-width: 100vw !important;
            min-width: 0 !important;
            text-align: center !important;
            word-break: break-word !important;
            white-space: normal !important;
          }
          h1, h3, p, label, span, input, select, button {
            font-size: clamp(0.95rem, 4vw, 1.1rem) !important;
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            text-align: center !important;
          }
        }
        @media (max-width: 480px) {
          main {
            padding: clamp(4px, 2vw, 6px) !important;
          }
          .pricing-card {
            max-width: clamp(260px, 99vw, 320px) !important;
          }
          .features-grid {
            gap: clamp(6px, 2vw, 10px) !important;
          }
          .trust-indicators {
            gap: clamp(8px, 2vw, 16px) !important;
          }
        }
        @media (max-width: 360px) {
          main {
            padding: clamp(2px, 2vw, 4px) !important;
          }
          .pricing-card {
            max-width: clamp(240px, 100vw, 280px) !important;
          }
          .features-grid {
            gap: clamp(4px, 2vw, 8px) !important;
          }
          .trust-indicators {
            gap: clamp(6px, 2vw, 12px) !important;
          }
        }
        /* Unauthenticated user styling */
        button.unauthenticated {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
        }
        button.unauthenticated:hover {
          background: #ccc !important;
          box-shadow: none !important;
          transform: none !important;
        }
        .payment-main-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          margin: 0 auto;
          width: 100%;
          max-width: 100vw;
          min-height: 100vh;
          box-sizing: border-box;
          padding: clamp(12px, 4vw, 32px) clamp(6px, 3vw, 24px) clamp(24px, 4vw, 40px) clamp(6px, 3vw, 24px);
        }
        @media (max-width: 1024px) {
          .payment-main-content {
            padding: clamp(10px, 3vw, 24px) clamp(4px, 2vw, 12px) clamp(16px, 4vw, 32px) clamp(4px, 2vw, 12px);
          }
        }
        @media (max-width: 600px) {
          .payment-main-content {
            padding: clamp(8px, 2vw, 16px) clamp(2px, 2vw, 8px) clamp(12px, 4vw, 24px) clamp(2px, 2vw, 8px);
            width: 100vw !important;
            max-width: 100vw !important;
          }
        }
      `}</style>

    </div>
  );
}

export default PaymentPage;
