import { useState, useEffect } from 'react';
import api from '../services/api';
import { Shift } from '../types';

export const useShift = () => {
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentShift = async () => {
      try {
        const response = await api.get('/shifts/current');
        setCurrentShift(response.data);
      } catch (error) {
        console.error('Error fetching current shift:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentShift();
  }, []);

  const isShiftActive = currentShift?.isActive ?? false;

  const getTimeRemaining = (): string => {
    if (!currentShift) return '0h 0m';
    
    const now = new Date();
    const endTime = new Date(currentShift.endTime);
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return '0h 0m';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return {
    currentShift,
    isShiftActive,
    isLoading,
    getTimeRemaining,
  };
};
