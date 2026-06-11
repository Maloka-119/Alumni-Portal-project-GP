import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import './Tour.css';

const Tour = ({ steps, onFinish, sidebarRef, darkMode }) => {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const visited = localStorage.getItem('alumniTourVisited');
    if (!visited && sidebarRef?.current) {
      setShow(true);
      localStorage.setItem('alumniTourVisited', 'true');
    }
  }, [sidebarRef]);

  const handleNext = () => {
    if (currentStep + 1 < steps.length) setCurrentStep(prev => prev + 1);
    else {
      setShow(false);
      if (onFinish) onFinish();
    }
  };

  const handleSkip = () => setShow(false);

  if (!show || !sidebarRef?.current) return null;

  const container = sidebarRef.current;
  const step = steps[currentStep];
  const targetEl = container.querySelector(`[data-tour="${step.selector}"]`);
  if (!targetEl) return null;

  targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const rect = targetEl.getBoundingClientRect();

  const highlightStyle = {
    top: rect.top - 4 + window.scrollY,
    left: rect.left - 4 + window.scrollX,
    width: rect.width + 8,
    height: rect.height + 8,
    position: 'absolute'
  };

  const tooltipWidth = 250;
  const padding = 10;

  let tooltipLeft = rect.left + window.scrollX;
  let tooltipTop = rect.bottom + window.scrollY + padding;

  if (window.innerHeight - rect.bottom < 110) {
    tooltipTop = rect.top + window.scrollY - 100;
  }

  tooltipLeft = Math.max(
    padding,
    Math.min(
      tooltipLeft,
      window.innerWidth - tooltipWidth - padding
    )
  );

  const message = t(step.messageKey);

  return (
    <div
      className="tour-overlay"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <div
        className={`tour-highlight ${darkMode ? 'dark' : 'light'} blink`}
        style={highlightStyle}
      />

      <div
        className={`tour-tooltip ${darkMode ? 'dark' : 'light'}`}
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          width: tooltipWidth
        }}
      >
        <div>{message}</div>
        <div className="tour-buttons">
          <button className="tour-next-btn" onClick={handleNext}>
            {t("next")}
          </button>
          <button className="tour-skip-btn" onClick={handleSkip}>
            {t("skip")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tour;
