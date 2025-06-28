import { useState, useCallback } from 'react';

export const useTapCounter = () => {
  const [sunriseTaps, setSunriseTaps] = useState(0);
  const [sunsetTaps, setSunsetTaps] = useState(0);

  const incrementSunriseTaps = useCallback(() => {
    setSunriseTaps(prev => prev + 1);
  }, []);

  const incrementSunsetTaps = useCallback(() => {
    setSunsetTaps(prev => prev + 1);
  }, []);

  const resetSunriseTaps = useCallback(() => {
    setSunriseTaps(0);
  }, []);

  const resetSunsetTaps = useCallback(() => {
    setSunsetTaps(0);
  }, []);

  return {
    sunriseTaps,
    sunsetTaps,
    incrementSunriseTaps,
    incrementSunsetTaps,
    resetSunriseTaps,
    resetSunsetTaps,
  };
}; 