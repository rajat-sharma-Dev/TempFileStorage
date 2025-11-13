// Pricing configuration for storage duration
export const PRICING = {
  1: 0.05,   // 1 day = $0.05 USDC
  7: 0.15,   // 7 days = $0.15 USDC
  30: 0.25,  // 30 days = $0.25 USDC
};

// Available duration options
export const DURATION_OPTIONS = [1, 7, 30];

// Get price for duration
export const getPriceForDuration = (days) => {
  return PRICING[days] || null;
};

// Validate duration
export const isValidDuration = (days) => {
  return DURATION_OPTIONS.includes(parseInt(days));
};
