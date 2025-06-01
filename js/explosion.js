// This logic has a critical bug, which makes the animation work only the first time. I do not have any more time to fix this, sorry. I really tried, but I'm skipping time for the other subjects.
import { flyingBlocks } from './gameState.js'

// Here I keep a list of all blocks that are supposed to be exploding right now
export let explodingBlocks = []

// When I want a block to explode, I add it to my list with a timer for how long it should explode
export function markBlockExploding( x , y , z , frames ) {
    explodingBlocks.push( { x : x , y : y , z : z , timer : frames } )
    // I just log this so I know when an explosion starts
    console.log( 'Explosion started at', x , y , z )
}

// Every frame, I count down the timer for each exploding block, and remove it when time is up
export function updateExplosions() {
    for ( let i = explodingBlocks.length - 1 ; i >= 0 ; i = i - 1 ) {
        explodingBlocks[ i ].timer = explodingBlocks[ i ].timer - 1
        // When timer is done, I remove the block from the list so it stops exploding
        if ( explodingBlocks[ i ].timer <= 0 ) {
            explodingBlocks.splice( i , 1 )
        }
    }
}

// I check if a block is in my exploding list, so I can draw it differently if needed
export function isBlockExploding( x , y , z ) {
    for ( let i = 0 ; i < explodingBlocks.length ; i = i + 1 ) {
        let b = explodingBlocks[ i ]
        if ( b.x === x && b.y === y && b.z === z ) {
            // If I find it, I know this block is exploding right now
            return true
        }
    }
    // If I don't find it, it's not exploding
    return false
} 