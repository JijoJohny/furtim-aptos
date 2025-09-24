import React, { useState, useEffect } from 'react';
import { Target, Palette, Code, Zap, Shield, Lock } from 'lucide-react';

interface AnimatedContentProps {}

const AnimatedContent: React.FC<AnimatedContentProps> = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const contentExamples = [
    {
      icon: <Target size={24} />,
      url: "furtim.me/emma/coaching",
      title: "Book a personal coaching session with Emma",
      description: "Private 1-on-1 coaching sessions with complete anonymity",
      color: "#ec4899"
    },
    {
      icon: <Code size={24} />,
      url: "furtim.me/dev/consulting",
      title: "Hire a blockchain developer",
      description: "Get expert smart contract development without revealing your identity",
      color: "#3b82f6"
    },
    {
      icon: <Palette size={24} />,
      url: "furtim.me/artist/commission",
      title: "Commission custom artwork",
      description: "Order personalized digital art while keeping your wallet private",
      color: "#8b5cf6"
    },
    {
      icon: <Shield size={24} />,
      url: "furtim.me/security/audit",
      title: "Smart contract security audit",
      description: "Professional security review with complete payment privacy",
      color: "#ef4444"
    },
    {
      icon: <Zap size={24} />,
      url: "furtim.me/mentor/guidance",
      title: "Get crypto mentoring",
      description: "Learn from industry experts while maintaining financial privacy",
      color: "#f59e0b"
    },
    {
      icon: <Lock size={24} />,
      url: "furtim.me/legal/consultation",
      title: "Legal consultation services",
      description: "Professional legal advice with anonymous payment processing",
      color: "#10b981"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % contentExamples.length);
        setIsAnimating(false);
      }, 300);
    }, 2000); // Changed to 2 seconds

    return () => clearInterval(interval);
  }, [contentExamples.length]);

  return (
    <div className="animated-content-container">
      <div className="dashboard-example-box">
        <div 
          className={`example-card ${isAnimating ? 'animating' : ''}`}
          style={{ '--card-color': contentExamples[currentIndex].color } as React.CSSProperties}
        >
          <div className="card-icon" style={{ color: contentExamples[currentIndex].color }}>
            {contentExamples[currentIndex].icon}
          </div>
          <div className="card-content">
            <div className="example-url">
              {contentExamples[currentIndex].url.split('/').map((part, i) => (
                <span key={i}>
                  {part}
                  {i < contentExamples[currentIndex].url.split('/').length - 1 && '/'}
                </span>
              ))}
            </div>
            <h3 className="example-title">{contentExamples[currentIndex].title}</h3>
            <p className="example-description">{contentExamples[currentIndex].description}</p>
          </div>
          <div className="pagination-dots">
            {contentExamples.map((_, index) => (
              <div 
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedContent;
