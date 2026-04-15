/**
 * Get Full Name
 * @name getFullName Concatenates first and last name
 * @param {string} firstName First name
 * @param {string} lastName Last name
 * @return {string}
 */
function getFullName(firstName, lastName) {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Validate Phone Format
 * @name validatePhone Checks if phone matches expected pattern
 * @param {string} phone Phone number
 * @return {boolean}
 */
function validatePhone(phone) {
  if (!phone) return true; // optional field
  const pattern = /^\+?[\d\s\-()]{7,15}$/;
  return pattern.test(phone);
}

export { getFullName, validatePhone };
