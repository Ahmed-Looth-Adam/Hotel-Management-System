/**
 * useLoading Hook - Custom hook for managing loading states
 *
 * Features:
 * - Simple API for managing loading states
 * - Supports multiple concurrent loading operations
 * - Auto-cleanup on unmount
 * - Error handling integration
 *
 * Usage:
 * const { isLoading, startLoading, stopLoading, withLoading } = useLoading();
 *
 * // Method 1: Manual control
 * startLoading();
 * await fetchData();
 * stopLoading();
 *
 * // Method 2: Automatic with async function
 * await withLoading(async () => {
 *   await fetchData();
 * });
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState, useCallback, useRef, useEffect } from 'react';

const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingCount, setLoadingCount] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Start loading state
   */
  const startLoading = useCallback(() => {
    if (isMounted.current) {
      setLoadingCount((prev) => prev + 1);
      setIsLoading(true);
    }
  }, []);

  /**
   * Stop loading state
   */
  const stopLoading = useCallback(() => {
    if (isMounted.current) {
      setLoadingCount((prev) => {
        const newCount = Math.max(0, prev - 1);
        if (newCount === 0) {
          setIsLoading(false);
        }
        return newCount;
      });
    }
  }, []);

  /**
   * Reset loading state
   */
  const resetLoading = useCallback(() => {
    if (isMounted.current) {
      setLoadingCount(0);
      setIsLoading(false);
    }
  }, []);

  /**
   * Execute an async function with automatic loading state management
   * @param {Function} asyncFunction - The async function to execute
   * @returns {Promise} The result of the async function
   */
  const withLoading = useCallback(
    async (asyncFunction) => {
      try {
        startLoading();
        const result = await asyncFunction();
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    resetLoading,
    withLoading,
  };
};

export default useLoading;
