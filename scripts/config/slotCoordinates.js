// --- START OF FILE slotCoordinates.js ---

/**
 * Generates XXXX:YYYY coordinate strings for a simple rectangular grid layout.
 * Assumes a horizontal step of 50 units AND a vertical step of 50 units.
 * The slot IDs increment sequentially across columns (0-63), then down rows.
 * This file provides coordinates for an external system (like the game UI)
 * and is NOT directly used by the app_visualizer.js for its rendering.
 */

const coordinates = [];

// --- Define the Positional Grid Parameters ---
const cellsPerRow = 64;        // Number of positional slots horizontally
const horizontalStep = 50;     // X coordinate increment per positional column
const verticalStep = 50;       // Y coordinate increment per positional row

// Set the maximum number of positional slots needed.
// Match or exceed MAX_SLOT_ID_DISPLAYED used in the visualizer.
// 32 rows * 64 cols = 2048
const maxSlots = 2048; // Generate coordinates for positional slots 0 to 2047

for (let slotID = 0; slotID < maxSlots; slotID++) {
    // Calculate row and column based on simple grid layout
    const logicalRow = Math.floor(slotID / cellsPerRow);
    const logicalCol = slotID % cellsPerRow;

    // Calculate the top-left coordinate for this positional slot
    const coordX = logicalCol * horizontalStep;
    const coordY = logicalRow * verticalStep;

    // Format to 4 digits with leading zeros
    const xxxxPadded = String(coordX).padStart(4, '0');
    const yyyyPadded = String(coordY).padStart(4, '0');

    coordinates.push(`${xxxxPadded}:${yyyyPadded}`);
}

/**
 * An array where the index represents the sequential positional slot ID (0-63, 64-127...)
 * and the value is the corresponding "XXXX:YYYY" coordinate string based on the
 * 50-unit horizontal and 50-unit vertical step. This array is intended for use
 * by the in-game UI system.
 */
export const slotCoordinates = coordinates;

// Example usage:
// console.log(`Slot 0: ${slotCoordinates[0]}`);     // Should be 0000:0000 (p0)
// console.log(`Slot 1: ${slotCoordinates[1]}`);     // Should be 0050:0000 (p1)
// console.log(`Slot 63: ${slotCoordinates[63]}`);   // Should be 3150:0000 (p63)
// console.log(`Slot 64: ${slotCoordinates[64]}`);   // Should be 0000:0050 (p64)
// console.log(`Slot 65: ${slotCoordinates[65]}`);   // Should be 0050:0050 (p65)
// console.log(`Slot 127: ${slotCoordinates[127]}`); // Should be 3150:0050 (p127)
// console.log(`Slot 128: ${slotCoordinates[128]}`); // Should be 0000:0100 (p128)
// console.log(`Slot 131: ${slotCoordinates[131]}`); // Should be 0150:0100 (p131 - potential top-left of blue)
// console.log(`Slot 196: ${slotCoordinates[196]}`); // Should be 0200:0150 (p196 - potential top-left of blue?) - Check your mapping!
// console.log(`Slot 322: ${slotCoordinates[322]}`); // Should be 0100:0250 (p322 - potential top-left of green)
// console.log(`Slot 386: ${slotCoordinates[386]}`); // Should be 0100:0300 (p386 - potential top-left of green?) - Check your mapping!


// --- END OF FILE slotCoordinates.js ---