// Early Ethereum injection blocker - runs as soon as possible
// This prevents browser extensions from injecting ethereum before our app loads

(function() {
  'use strict';
  
  // Block ethereum injection immediately
  if (typeof window !== 'undefined') {
    // Create a frozen ethereum property that cannot be overwritten
    try {
      Object.defineProperty(window, 'ethereum', {
        value: null,
        writable: false,
        enumerable: false,
        configurable: false
      });
    } catch (e) {
      // If already defined, try to make it non-writable
      try {
        const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
        if (descriptor && descriptor.configurable) {
          Object.defineProperty(window, 'ethereum', {
            writable: false,
            configurable: false
          });
        }
      } catch (e2) {
        // Ignore if we can't modify it
      }
    }
    
    // Override Object.defineProperty to block ethereum injection
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
      if (obj === window && prop === 'ethereum') {
        console.warn('Blocked ethereum injection attempt via defineProperty');
        return obj;
      }
      return originalDefineProperty.call(this, obj, prop, descriptor);
    };
    
    // Block direct assignment
    const originalSetProperty = Object.prototype.__defineSetter__;
    if (originalSetProperty) {
      Object.prototype.__defineSetter__ = function(prop, setter) {
        if (prop === 'ethereum' && this === window) {
          console.warn('Blocked ethereum injection attempt via setter');
          return;
        }
        return originalSetProperty.call(this, prop, setter);
      };
    }
    
    console.log('Early Ethereum blocker active - Aptos wallets only');
  }
})();

