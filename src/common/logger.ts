export const logger = {
  debug: (...args: any[]) => {
    try {
      console.debug &&
        console.debug(new Date().toISOString(), 'DEBUG', ...args);
    } catch (e) {
      /* ignore */
    }
  },
  info: (...args: any[]) => {
    try {
      console.info && console.info(new Date().toISOString(), 'INFO', ...args);
    } catch (e) {}
  },
  warn: (...args: any[]) => {
    try {
      console.warn && console.warn(new Date().toISOString(), 'WARN', ...args);
    } catch (e) {}
  },
  error: (...args: any[]) => {
    try {
      console.error &&
        console.error(new Date().toISOString(), 'ERROR', ...args);
    } catch (e) {}
  },
};

export default logger;
