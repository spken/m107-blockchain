/**
 * Simple logging utility for the Certificate Blockchain
 */
class Logger {
  static log(message, data = null) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[${timestamp}] ${message}`, data);
    } else {
      console.log(`[${timestamp}] ${message}`);
    }
  }

  static error(message, error = null) {
    const timestamp = new Date().toISOString();
    if (error) {
      console.error(`[${timestamp}] ERROR: ${message}`, error);
    } else {
      console.error(`[${timestamp}] ERROR: ${message}`);
    }
  }

  static warn(message, data = null) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.warn(`[${timestamp}] WARN: ${message}`, data);
    } else {
      console.warn(`[${timestamp}] WARN: ${message}`);
    }
  }

  static info(message, data = null) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.info(`[${timestamp}] INFO: ${message}`, data);
    } else {
      console.info(`[${timestamp}] INFO: ${message}`);
    }
  }
}

module.exports = Logger;
