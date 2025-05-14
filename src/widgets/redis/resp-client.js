/**
 * A simplified Redis RESP client implementation
 * Only implements the INFO command for the Redis widget
 */

import { Socket } from 'node:net';

/**
 * Send a Redis INFO command and parse the response
 * @param {string} host Redis host
 * @param {number} port Redis port
 * @param {string} password Redis password (optional)
 * @returns {Promise<Object>} Parsed Redis INFO response
 */
async function getRedisInfo(host, port, password) {
  return new Promise((resolve, reject) => {
    const client = new Socket();
    let responseData = '';

    client.connect(port, host, () => {
      // If password is provided, authenticate first
      if (password) {
        client.write(`AUTH ${password}\r\n`);
      }

      // Send the INFO command
      client.write('INFO\r\n');
    });

    client.on('data', (data) => {
      responseData += data.toString();

      // Check if we've received the complete response
      if (responseData.endsWith('\r\n')) {
        client.destroy();

        try {
          // Parse the RESP protocol response
          const parsedResponse = parseRespResponse(responseData);
          resolve(parsedResponse);
        } catch (error) {
          reject(error);
        }
      }
    });

    client.on('error', (error) => {
      client.destroy();
      reject(error);
    });

    // Set a timeout to prevent hanging connections
    client.setTimeout(5000, () => {
      client.destroy();
      reject(new Error('Connection timeout'));
    });
  });
}

/**
 * Parse a Redis RESP protocol response
 * This only handles bulk strings for INFO command
 * @param {string} response RESP protocol response
 * @returns {Object} Parsed Redis INFO data
 */
function parseRespResponse(response) {
  // For AUTH command, the response is a simple string
  if (response.startsWith('+OK')) {
    // Skip the AUTH response and find the INFO response
    const infoResponseStart = response.indexOf('$');
    if (infoResponseStart === -1) {
      throw new Error('Invalid RESP response format');
    }
    response = response.substring(infoResponseStart);
  }

  // For INFO command, the response is a bulk string
  if (response.startsWith('$')) {
    // Extract the length of the bulk string
    const newlineIndex = response.indexOf('\r\n');
    const lengthStr = response.substring(1, newlineIndex);
    const length = parseInt(lengthStr, 10);

    if (isNaN(length)) {
      throw new Error('Invalid RESP response format');
    }

    // Extract the bulk string content
    const content = response.substring(newlineIndex + 2, newlineIndex + 2 + length);

    // Parse the INFO command response
    return parseRedisInfo(content);
  }

  // Handle error responses
  if (response.startsWith('-')) {
    throw new Error(response.substring(1).trim());
  }

  throw new Error('Unsupported RESP response type');
}

/**
 * Parse Redis INFO command response
 * @param {string} infoStr INFO command response string
 * @returns {Object} Parsed INFO data
 */
function parseRedisInfo(infoStr) {
  const info = {};
  const lines = infoStr.split('\r\n');

  for (const line of lines) {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split(':');
      if (key && value !== undefined) {
        info[key.trim()] = value.trim();
      }
    }
  }

  return info;
}

export {
  getRedisInfo,
  parseRedisInfo,
};
