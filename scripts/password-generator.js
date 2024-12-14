/**
 * Password Hash Generator Utility
 * 
 * This utility generates bcrypt hashes for passwords that can be stored in users.json.
 * It uses a salt rounds value of 10, which provides a good balance between security and performance.
 * 
 * Usage:
 * 1. Modify the 'password' constant below to the desired password
 * 2. Run the script using Node.js: node password-generator.js
 * 3. Copy the generated hash into users.json
 * 
 * Security Notes:
 * - Never store plaintext passwords
 * - The generated hash already includes the salt
 * - Each run will generate a different hash for the same password (this is normal)
 */

const bcrypt = require('bcrypt');

/**
 * Generates a bcrypt hash for the specified password
 * Uses async/await for better performance
 * 
 * @param {string} password - The password to hash (default: 'password123')
 * @param {number} saltRounds - Number of salt rounds (default: 10)
 */
async function generateHash() {
    // CHANGE THIS to your desired password
    const password = 'password123';
    const saltRounds = 10;

    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Generated hash:', hash);
        console.log('\nYou can now add this hash to users.json in the format:');
        console.log('{\n  "users": [\n    {\n      "username": "YOUR_USERNAME",');
        console.log(`      "password": "${hash}"\n    }\n  ]\n}`);
    } catch (error) {
        console.error('Error generating hash:', error.message);
        process.exit(1);
    }
}

// Execute the hash generation
generateHash();