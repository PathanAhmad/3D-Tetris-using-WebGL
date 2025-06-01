// Here I keep all the constants for the game. I use these everywhere.

// This is how wide the grid is (x direction)
export const GRID_W = 4

// This is how deep the grid is (z direction)
export const GRID_D = 4

// This is how tall the grid is (y direction)
export const GRID_H = 12

// This is the size of each block
export const BLOCK = 1.0

// This is how fast gravity pulls the piece down (milliseconds)
export const GRAVITY_MS = 700

// I make sure the grid size is allowed (between 4 and 8)
if ( GRID_W < 4 || GRID_W > 8 || GRID_D < 4 || GRID_D > 8 ) throw 'grid size out of spec' 