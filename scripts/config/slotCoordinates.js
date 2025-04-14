const coordinates = [];
// A full cycle in the sequential numbering includes one row of outer cells
// and the subsequent row of inner squares.
const outerCellsPerRow = 32; // 0000 to 3100, step 100
const innerSquaresPerRow = 31; // 0050 to 3050, step 100
const stepsPerFullRowCycle = outerCellsPerRow + innerSquaresPerRow; // 32 + 31 = 63

// Set the maximum number of slots you need coordinates for.
// Max possible slots = 15 outer rows * 32 cells + 14 inner rows * 31 squares
// = 480 + 434 = 914.
// Let's generate up to the user's requested max or slightly more.
const maxSlots = 914; // Generate coordinates for all possible slots in the grid.

for (let slotID = 0; slotID < maxSlots; slotID++) {
    // Determine which full row cycle the slotID falls into
    const rowCycleIndex = Math.floor(slotID / stepsPerFullRowCycle); // e.g., 0 for slots 0-62, 1 for 63-125, etc.

    // Determine the position within that cycle
    const stepInCycle = slotID % stepsPerFullRowCycle; // 0 to 62

    let coordX = 0;
    let coordY = 0;

    if (stepInCycle < outerCellsPerRow) {
        // --- This slotID corresponds to an OUTER CELL ---
        // Y coordinate is based on the row cycle index * 100
        coordY = rowCycleIndex * 100;
        // X coordinate is based on the step within the cycle * 100
        coordX = stepInCycle * 100;
    } else {
        // --- This slotID corresponds to an INNER SQUARE ---
        // Y coordinate is based on the row cycle index * 100 + 50 offset
        coordY = rowCycleIndex * 100 + 50;
        // X coordinate calculation needs the index *within the inner squares* for this row
        const innerSquareIndex = stepInCycle - outerCellsPerRow; // Index from 0 to 30
        coordX = innerSquareIndex * 100 + 50;
    }

    // Format to 4 digits with leading zeros
    const xxxxPadded = String(coordX).padStart(4, '0');
    const yyyyPadded = String(coordY).padStart(4, '0');

    coordinates.push(`${xxxxPadded}:${yyyyPadded}`);
}

/**
 * An array where the index represents the sequential slot ID (matching the
 * numbers displayed in the grid) and the value is the corresponding
 * "XXXX:YYYY" coordinate string based on the grid layout.
 */
// Use 'coordinates' directly or export it if in a module
export const slotCoordinates = coordinates;

// Example usage:
// console.log(`Slot 0: ${slotCoordinates[0]}`);     // Should be 0000:0000
// console.log(`Slot 31: ${slotCoordinates[31]}`);    // Should be 3100:0000
// console.log(`Slot 32: ${slotCoordinates[32]}`);    // Should be 0050:0050
// console.log(`Slot 62: ${slotCoordinates[62]}`);    // Should be 3050:0050
// console.log(`Slot 63: ${slotCoordinates[63]}`);    // Should be 0000:0100
// console.log(`Slot 913: ${slotCoordinates[913]}`); // Last slot