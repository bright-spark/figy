const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a canvas
const canvas = createCanvas(800, 600);
const ctx = canvas.getContext('2d');

// Set background
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, 800, 600);

// Draw a header rectangle
ctx.fillStyle = '#4a90e2';
ctx.fillRect(0, 0, 800, 80);

// Add header text
ctx.font = 'bold 32px Arial';
ctx.fillStyle = '#ffffff';
ctx.fillText('Welcome Dashboard', 30, 50);

// Draw a button
ctx.fillStyle = '#27ae60';
ctx.fillRect(30, 100, 120, 40);
ctx.font = '16px Arial';
ctx.fillStyle = '#ffffff';
ctx.fillText('Get Started', 50, 125);

// Draw some text
ctx.font = '18px Arial';
ctx.fillStyle = '#333333';
ctx.fillText('Recent Activity', 30, 180);

// Draw a list container
ctx.fillStyle = '#f5f5f5';
ctx.fillRect(30, 200, 740, 200);

// Save the image
const outputPath = path.join(__dirname, 'test-ui.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log('Test UI image created:', outputPath);
