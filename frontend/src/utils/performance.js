// Performance optimization utilities

// Debounce function for search inputs and heavy operations
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Throttle function for scroll events
export const throttle = (func, wait) => {
  let timeout;
  return (...args) => {
    if (!timeout) {
      timeout = setTimeout(() => {
        func.apply(this, args);
        timeout = null;
      }, wait);
    }
  };
};

// Lazy load images
export const lazyLoadImage = (src, placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7') => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(placeholder);
    img.src = src;
  });
};

// Check if element is in viewport
export const isInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// Request idle callback fallback
export const requestIdleCallback = window.requestIdleCallback || 
  ((cb) => setTimeout(cb, 1));

// Memory-efficient object comparison for memo
export const shallowEqual = (objA, objB) => {
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
        objA[keysA[i]] !== objB[keysA[i]]) {
      return false;
    }
  }
  
  return true;
};

// Performance monitoring
export const performanceMonitor = {
  startTime: Date.now(),
  
  mark: (name) => {
    if (performance && performance.mark) {
      performance.mark(name);
    }
  },
  
  measure: (name, startMark, endMark) => {
    if (performance && performance.measure) {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name);
      if (measures.length > 0) {
        console.log(`${name}: ${measures[0].duration.toFixed(2)}ms`);
      }
    }
  },
  
  logRenderTime: (componentName, renderTime) => {
    if (renderTime > 16) { // Más de un frame (16ms)
      console.warn(`⚠️ Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }
};

// Cache for expensive calculations
export class MemoryCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value); // Move to end (most recently used)
      return value;
    }
    return undefined;
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  clear() {
    this.cache.clear();
  }
}