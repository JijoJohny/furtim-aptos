// Block Ethereum wallet injection before it happens
// This script runs early to prevent ethereum property conflicts

(function() {
  'use strict';
  
  // Store original defineProperty if it exists
  const originalDefineProperty = Object.defineProperty;
  
  // Override defineProperty to block ethereum property injection
  Object.defineProperty = function(obj, prop, descriptor) {
    // Block ethereum property injection on window
    if (obj === window && prop === 'ethereum') {
      console.warn('Blocked attempt to inject ethereum property into window');
      return obj; // Return the object unchanged
    }
    
    // Block ethereum property injection on any object
    if (prop === 'ethereum' && descriptor && descriptor.value) {
      console.warn('Blocked attempt to inject ethereum property');
      return obj; // Return the object unchanged
    }
    
    // Allow all other property definitions
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
  
  // Block direct assignment attempts
  const originalSetProperty = Object.prototype.__defineSetter__;
  if (originalSetProperty) {
    Object.prototype.__defineSetter__ = function(prop, setter) {
      if (prop === 'ethereum' && this === window) {
        console.warn('Blocked attempt to set ethereum setter on window');
        return;
      }
      return originalSetProperty.call(this, prop, setter);
    };
  }
  
  // Create a read-only ethereum property that prevents overwrites
  try {
    Object.defineProperty(window, 'ethereum', {
      value: undefined,
      writable: false,
      configurable: false,
      enumerable: false
    });
  } catch (e) {
    // If ethereum already exists, make it non-writable
    try {
      Object.defineProperty(window, 'ethereum', {
        writable: false,
        configurable: false
      });
    } catch (e2) {
      console.warn('Could not block ethereum injection:', e2.message);
    }
  }
  
  console.log('Ethereum injection blocker initialized - Aptos wallets only');
})();

