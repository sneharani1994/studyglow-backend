/**
 * Generates helper functions for backend routines.
 */

/**
 * Calculates user study level XP milestones.
 * Each level requires 200 XP.
 * @param {number} currentXp 
 * @returns {number} calculated level
 */
const calculateLevel = (currentXp) => {
  return Math.floor(currentXp / 200) + 1;
};

/**
 * Formats standard duration timestamps.
 * @param {Date} date 
 * @returns {string} ISO Date String
 */
const formatIsoTimestamp = (date = new Date()) => {
  return date.toISOString();
};

/**
 * Checks if a string is a valid UUID format.
 * @param {string} uuid 
 * @returns {boolean} true if valid UUID
 */
const isValidUuid = (uuid) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

module.exports = {
  calculateLevel,
  formatIsoTimestamp,
  isValidUuid
};
