const crypto = require("crypto");

// Password policy: at least 8 characters, containing a letter and a number.
const PASSWORD_MIN = 8;
const PASSWORD_MESSAGE = `Password must be at least ${PASSWORD_MIN} characters and include a letter and a number.`;

const isStrongPassword = (pw) =>
  typeof pw === "string" && pw.length >= PASSWORD_MIN && /[A-Za-z]/.test(pw) && /\d/.test(pw);

// A random temporary password that always satisfies the policy above.
const generateTempPassword = () => {
  const digits = "0123456789";
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to keep it readable
  return (
    crypto.randomBytes(9).toString("base64url") +
    digits[crypto.randomInt(digits.length)] +
    letters[crypto.randomInt(letters.length)]
  );
};

module.exports = { PASSWORD_MIN, PASSWORD_MESSAGE, isStrongPassword, generateTempPassword };
