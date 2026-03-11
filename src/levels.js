// Missile types: 'standard', 'fast', 'zigzag', 'cluster', 'heavy', 'decoy', 'mirv'
// Each level: { name, quote, waves: [{ delay, missiles: [{ type, x (0-1), speed }] }] }

function spreadMissiles(count, type, speed, startDelay = 0) {
    const missiles = [];
    for (let i = 0; i < count; i++) {
        missiles.push({
            type,
            x: 0.1 + Math.random() * 0.8,
            speed,
            delay: startDelay + i * (0.5 + Math.random() * 0.4)
        });
    }
    return missiles;
}

function waveMissiles(types, speeds, count, stagger = 0.4) {
    const missiles = [];
    for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * types.length);
        missiles.push({
            type: types[idx],
            x: 0.08 + Math.random() * 0.84,
            speed: speeds[idx] + (Math.random()-0.5) * 20,
            delay: i * (stagger + Math.random() * 0.2)
        });
    }
    return missiles;
}

export const LEVELS = [
    // Level 1: First Contact
    {
        name: "First Contact",
        quote: "Your pitiful defense amuses me.",
        waves: [
            { delay: 2, missiles: spreadMissiles(3, 'standard', 55) },
            { delay: 8, missiles: spreadMissiles(3, 'standard', 60) },
        ]
    },
    // Level 2: Testing the Waters
    {
        name: "Testing the Waters",
        quote: "Let us see how long you last...",
        waves: [
            { delay: 1, missiles: spreadMissiles(5, 'standard', 90) },
            { delay: 5, missiles: spreadMissiles(5, 'standard', 95) },
        ]
    },
    // Level 3: Picking Up Speed
    {
        name: "Picking Up Speed",
        quote: "Too slow! HAHAHA!",
        waves: [
            { delay: 1, missiles: spreadMissiles(4, 'standard', 100) },
            { delay: 4, missiles: spreadMissiles(4, 'standard', 105) },
            { delay: 7, missiles: [
                ...spreadMissiles(2, 'fast', 160),
                ...spreadMissiles(2, 'standard', 100, 1)
            ]},
        ]
    },
    // Level 4: Spread Formation
    {
        name: "Spread Formation",
        quote: "Attack from all sides!",
        waves: [
            { delay: 1, missiles: [
                { type:'standard', x:0.1, speed:100, delay:0 },
                { type:'standard', x:0.2, speed:105, delay:0.3 },
                { type:'standard', x:0.3, speed:100, delay:0.6 },
            ]},
            { delay: 4, missiles: [
                { type:'standard', x:0.7, speed:100, delay:0 },
                { type:'standard', x:0.8, speed:105, delay:0.3 },
                { type:'standard', x:0.9, speed:100, delay:0.6 },
            ]},
            { delay: 7, missiles: spreadMissiles(5, 'standard', 110) },
        ]
    },
    // Level 5: Snake Attack
    {
        name: "Snake Attack",
        quote: "Try hitting THESE!",
        waves: [
            { delay: 1, missiles: spreadMissiles(4, 'standard', 100) },
            { delay: 4, missiles: [
                ...spreadMissiles(2, 'zigzag', 85),
                ...spreadMissiles(3, 'standard', 105, 1),
            ]},
            { delay: 8, missiles: spreadMissiles(4, 'zigzag', 90) },
        ]
    },
    // Level 6: The Swarm
    {
        name: "The Swarm",
        quote: "NUMBERS! I have NUMBERS!",
        waves: [
            { delay: 0.5, missiles: spreadMissiles(5, 'standard', 110, 0) },
            { delay: 3, missiles: spreadMissiles(5, 'standard', 115, 0) },
            { delay: 5.5, missiles: spreadMissiles(4, 'standard', 120, 0) },
            { delay: 7.5, missiles: spreadMissiles(4, 'fast', 155, 0) },
        ]
    },
    // Level 7: Heavy Hitter
    {
        name: "Heavy Hitter",
        quote: "Meet my BIG friends...",
        waves: [
            { delay: 1, missiles: spreadMissiles(4, 'standard', 105) },
            { delay: 4, missiles: [
                { type:'heavy', x:0.3, speed:65, delay:0 },
                { type:'heavy', x:0.7, speed:65, delay:1 },
                ...spreadMissiles(3, 'standard', 110, 0.5),
            ]},
            { delay: 9, missiles: spreadMissiles(5, 'standard', 115) },
        ]
    },
    // Level 8: Tricks and Traps
    {
        name: "Tricks and Traps",
        quote: "Not everything is as it seems...",
        waves: [
            { delay: 1, missiles: waveMissiles(['standard','decoy'], [105, 100], 5) },
            { delay: 5, missiles: waveMissiles(['standard','decoy','fast'], [110, 95, 155], 6) },
            { delay: 9, missiles: waveMissiles(['standard','decoy'], [115, 100], 5) },
        ]
    },
    // Level 9: Cluster Storm
    {
        name: "Cluster Storm",
        quote: "SURPRISE! There are MORE inside!",
        waves: [
            { delay: 1, missiles: spreadMissiles(4, 'standard', 105) },
            { delay: 4, missiles: [
                { type:'cluster', x:0.3, speed:80, delay:0 },
                { type:'cluster', x:0.7, speed:80, delay:1.5 },
                ...spreadMissiles(2, 'standard', 110, 0.5),
            ]},
            { delay: 9, missiles: [
                { type:'cluster', x:0.5, speed:85, delay:0 },
                ...spreadMissiles(3, 'fast', 150, 0.5),
            ]},
        ]
    },
    // Level 10: BOSS
    {
        name: "General's Pride",
        quote: "WITNESS MY ULTIMATE WEAPON!",
        isBoss: true,
        waves: [
            { delay: 1, missiles: spreadMissiles(5, 'standard', 110) },
            { delay: 5, missiles: waveMissiles(['standard','fast'], [115, 155], 5) },
            { delay: 9, missiles: waveMissiles(['standard','zigzag'], [115, 90], 5) },
            { delay: 13, missiles: [
                { type:'mirv', x:0.5, speed:55, delay:0 },
            ]},
        ]
    },
    // Level 11: Relentless
    {
        name: "Relentless",
        quote: "No rest for you!",
        waves: [
            { delay: 0.5, missiles: waveMissiles(['standard','fast','zigzag'], [120, 160, 95], 5, 0.35) },
            { delay: 3.5, missiles: waveMissiles(['standard','fast'], [120, 165], 5, 0.35) },
            { delay: 6, missiles: waveMissiles(['standard','zigzag'], [125, 95], 5, 0.35) },
            { delay: 8.5, missiles: waveMissiles(['standard','fast','zigzag'], [125, 165, 100], 4, 0.3) },
            { delay: 10.5, missiles: spreadMissiles(3, 'fast', 170) },
        ]
    },
    // Level 12: Night Raid
    {
        name: "Night Raid",
        quote: "Darkness is my ally!",
        isNight: true,
        waves: [
            { delay: 1, missiles: waveMissiles(['fast','zigzag'], [165, 100], 5, 0.4) },
            { delay: 4.5, missiles: waveMissiles(['fast','standard'], [170, 125], 5, 0.35) },
            { delay: 7.5, missiles: waveMissiles(['zigzag','fast'], [100, 175], 5, 0.35) },
            { delay: 10, missiles: spreadMissiles(5, 'fast', 170) },
        ]
    },
    // Level 13: The Gauntlet
    {
        name: "The Gauntlet",
        quote: "EVERYTHING AT ONCE!",
        waves: [
            { delay: 0.5, missiles: waveMissiles(['standard','fast','zigzag'], [125, 170, 100], 6, 0.3) },
            { delay: 3, missiles: waveMissiles(['standard','fast','heavy'], [130, 170, 70], 5, 0.3) },
            { delay: 5.5, missiles: waveMissiles(['fast','zigzag','standard'], [175, 105, 130], 5, 0.3) },
            { delay: 8, missiles: waveMissiles(['standard','fast'], [130, 175], 5, 0.25) },
            { delay: 10, missiles: spreadMissiles(4, 'fast', 180) },
        ]
    },
    // Level 14: Cluster Madness
    {
        name: "Cluster Madness",
        quote: "Every missile hides more missiles!",
        waves: [
            { delay: 1, missiles: [
                { type:'cluster', x:0.2, speed:85, delay:0 },
                { type:'cluster', x:0.5, speed:85, delay:1 },
                { type:'cluster', x:0.8, speed:85, delay:2 },
            ]},
            { delay: 6, missiles: [
                ...spreadMissiles(3, 'standard', 130),
                { type:'cluster', x:0.4, speed:90, delay:1 },
                { type:'cluster', x:0.6, speed:90, delay:1.5 },
            ]},
            { delay: 11, missiles: [
                { type:'cluster', x:0.5, speed:95, delay:0 },
                ...spreadMissiles(4, 'fast', 170, 0.5),
            ]},
        ]
    },
    // Level 15: Decoy Blitz
    {
        name: "Decoy Blitz",
        quote: "Real? Fake? Can you tell?!",
        waves: [
            { delay: 0.5, missiles: waveMissiles(['standard','decoy','decoy'], [130, 110, 120], 7, 0.3) },
            { delay: 4, missiles: waveMissiles(['standard','fast','decoy','decoy'], [130, 170, 115, 125], 7, 0.3) },
            { delay: 7.5, missiles: waveMissiles(['standard','decoy','fast','decoy'], [135, 110, 175, 120], 7, 0.3) },
            { delay: 11, missiles: waveMissiles(['fast','decoy','standard'], [175, 120, 135], 7, 0.25) },
        ]
    },
    // Level 16: Heavy Bombardment
    {
        name: "Heavy Bombardment",
        quote: "These ones don't go down easy!",
        waves: [
            { delay: 1, missiles: [
                { type:'heavy', x:0.25, speed:70, delay:0 },
                { type:'heavy', x:0.75, speed:70, delay:0.8 },
                ...spreadMissiles(3, 'standard', 130, 0.3),
            ]},
            { delay: 6, missiles: [
                { type:'heavy', x:0.5, speed:75, delay:0 },
                ...waveMissiles(['standard','fast'], [135, 175], 4, 0.35),
            ]},
            { delay: 10, missiles: [
                { type:'heavy', x:0.3, speed:75, delay:0 },
                { type:'heavy', x:0.7, speed:75, delay:0.5 },
                { type:'heavy', x:0.5, speed:80, delay:1 },
                ...spreadMissiles(3, 'fast', 175, 0.5),
            ]},
        ]
    },
    // Level 17: All-Out Assault
    {
        name: "All-Out Assault",
        quote: "LAUNCH EVERYTHING!!!",
        waves: [
            { delay: 0.5, missiles: waveMissiles(['standard','fast','zigzag','cluster'], [135, 180, 105, 90], 6, 0.3) },
            { delay: 4, missiles: waveMissiles(['heavy','fast','standard','zigzag'], [75, 180, 135, 105], 6, 0.3) },
            { delay: 7.5, missiles: waveMissiles(['fast','standard','cluster','decoy'], [185, 140, 95, 120], 6, 0.25) },
            { delay: 10.5, missiles: waveMissiles(['fast','zigzag','standard'], [185, 110, 140], 6, 0.25) },
            { delay: 13, missiles: waveMissiles(['fast','fast','standard'], [190, 185, 140], 6, 0.2) },
        ]
    },
    // Level 18: Speed Demons
    {
        name: "Speed Demons",
        quote: "FASTER! FASTER! FASTER!",
        waves: [
            { delay: 0.5, missiles: spreadMissiles(5, 'fast', 200, 0) },
            { delay: 3, missiles: spreadMissiles(5, 'fast', 210, 0) },
            { delay: 5.5, missiles: spreadMissiles(5, 'fast', 220, 0) },
            { delay: 8, missiles: spreadMissiles(5, 'fast', 230, 0) },
            { delay: 10, missiles: spreadMissiles(5, 'fast', 240, 0) },
        ]
    },
    // Level 19: The Last Stand
    {
        name: "The Last Stand",
        quote: "This... this can't be happening!",
        waves: [
            { delay: 0.5, missiles: waveMissiles(['standard','fast','zigzag','heavy'], [140, 190, 110, 80], 6, 0.25) },
            { delay: 3.5, missiles: waveMissiles(['fast','cluster','standard','zigzag'], [195, 95, 145, 110], 5, 0.25) },
            { delay: 6, missiles: waveMissiles(['fast','standard','heavy','zigzag'], [195, 145, 80, 115], 6, 0.2) },
            { delay: 8.5, missiles: waveMissiles(['fast','fast','cluster','standard'], [200, 195, 100, 145], 5, 0.2) },
            { delay: 11, missiles: waveMissiles(['fast','standard','zigzag'], [200, 150, 115], 5, 0.2) },
            { delay: 13, missiles: waveMissiles(['fast','fast','standard'], [205, 200, 150], 5, 0.18) },
            { delay: 15, missiles: spreadMissiles(3, 'fast', 210) },
        ]
    },
    // Level 20: FINAL BOSS
    {
        name: "Total Annihilation",
        quote: "YOU WILL NEVER DEFEAT ME!!!",
        isBoss: true,
        waves: [
            { delay: 1, missiles: waveMissiles(['standard','fast','zigzag'], [145, 200, 115], 5, 0.3) },
            { delay: 4.5, missiles: waveMissiles(['fast','heavy','cluster'], [200, 80, 100], 5, 0.3) },
            { delay: 8, missiles: waveMissiles(['fast','zigzag','standard','heavy'], [205, 120, 150, 85], 5, 0.25) },
            { delay: 11, missiles: waveMissiles(['fast','standard','fast'], [210, 150, 200], 5, 0.25) },
            { delay: 14, missiles: [
                { type:'mirv', x:0.3, speed:60, delay:0 },
                { type:'mirv', x:0.7, speed:60, delay:2 },
            ]},
            { delay: 20, missiles: spreadMissiles(8, 'fast', 220, 0) },
            { delay: 23, missiles: [
                { type:'mirv', x:0.5, speed:55, delay:0, warheads: 8 },
            ]},
        ]
    },
];
