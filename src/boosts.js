// 19 boost choice pairs (shown between levels 1-19 -> 2-20)
// Each: { left: { name, icon, desc, effect, stat, value }, right: { ... } }

export const BOOSTS = [
    // After Level 1
    {
        left: { name:"Mandatory Fun Day", icon:"\u{1F3C3}", desc:"Nothing boosts fighting spirit like a 3-legged race.", effect:"Morale +1", stat:"morale", value:1 },
        right: { name:"Bigger Warheads", icon:"\u{1F4A3}", desc:"Compensating for something? Yes. Poor aim.", effect:"Firepower +1", stat:"firepower", value:1 },
    },
    // After Level 2
    {
        left: { name:"Caffeine IV Drip", icon:"\u{2615}", desc:"Approved by the Surgeon General under duress.", effect:"Reload Speed +1", stat:"reload", value:1 },
        right: { name:"Sleep With Subordinate Officer", icon:"\u{1F608}", desc:"Technically a violation. Practically a tradition.", effect:"Morale +1", stat:"morale", value:1 },
    },
    // After Level 3
    {
        left: { name:"Duct Tape the Radar", icon:"\u{1F4E1}", desc:"If it's stupid but it works...", effect:"Max Missiles +1", stat:"maxInterceptors", value:1 },
        right: { name:"Motivational Posters", icon:"\u{1F5BC}", desc:"Hang in there! (The missile sure will.)", effect:"Morale +1", stat:"morale", value:1 },
    },
    // After Level 4
    {
        left: { name:"Rocket Fuel Energy Drinks", icon:"\u{1F680}", desc:"Side effects include everything.", effect:"Missile Speed +1", stat:"speed", value:1 },
        right: { name:"Requisition Forms (Triplicate)", icon:"\u{1F4CB}", desc:"The real weapon was bureaucracy all along.", effect:"Repair +1 HP", stat:"repair", value:1 },
    },
    // After Level 5
    {
        left: { name:"Classified Warhead Upgrade", icon:"\u{1F50D}", desc:"[REDACTED] but it makes a bigger boom.", effect:"Firepower +1", stat:"firepower", value:1 },
        right: { name:"Bring Your Dog to Base", icon:"\u{1F415}", desc:"Puppy therapy is a legitimate military strategy.", effect:"Morale +1", stat:"morale", value:1 },
    },
    // After Level 6
    {
        left: { name:"Coffee Machine in Turret", icon:"\u{2615}", desc:"Two shots at once: espresso and missile.", effect:"Reload Speed +1", stat:"reload", value:1 },
        right: { name:"General's Pep Talk", icon:"\u{1F3D6}", desc:"He cried. Everyone cried. Morale soared.", effect:"Score Mult +1", stat:"morale", value:1 },
    },
    // After Level 7
    {
        left: { name:"Rubber Band Catapult Assist", icon:"\u{1F3AF}", desc:"Innovation on a budget.", effect:"Missile Speed +1", stat:"speed", value:1 },
        right: { name:"Field Hospital (Competent)", icon:"\u{1F3E5}", desc:"Found a doctor who actually passed med school.", effect:"Repair +2 HP", stat:"repair", value:2 },
    },
    // After Level 8
    {
        left: { name:"Extra Tube Welded On", icon:"\u{1F527}", desc:"Health & safety had opinions. We didn't listen.", effect:"Max Missiles +1", stat:"maxInterceptors", value:1 },
        right: { name:"Karaoke Night", icon:"\u{1F3A4}", desc:"The colonel's rendition was... an event.", effect:"Morale +1", stat:"morale", value:1 },
    },
    // After Level 9
    {
        left: { name:"Experimental Warheads", icon:"\u{2622}", desc:"50% chance of working. 100% chance of spectacle.", effect:"Firepower +1", stat:"firepower", value:1 },
        right: { name:"Remove Safety Checks", icon:"\u{26A0}", desc:"Step 1: Remove safety checks. That's it.", effect:"Reload Speed +1", stat:"reload", value:1 },
    },
    // After Level 10 (Boss reward — bigger choices)
    {
        left: { name:"Alien Technology Fragment", icon:"\u{1F47D}", desc:"Found in the debris. Don't ask questions.", effect:"Firepower +1, Speed +1", stat:"firePlusSpeed", value:1 },
        right: { name:"Declare National Holiday", icon:"\u{1F389}", desc:"Your face is on a stamp now.", effect:"Morale +2, Repair +1", stat:"moralePlusRepair", value:1 },
    },
    // After Level 11
    {
        left: { name:"Turbo Thrusters (Probably Safe)", icon:"\u{1F525}", desc:"The manual was in a language we can't read.", effect:"Missile Speed +1", stat:"speed", value:1 },
        right: { name:"Pizza Party", icon:"\u{1F355}", desc:"The oldest morale trick in the book. Still works.", effect:"Morale +1", stat:"morale", value:1 },
    },
    // After Level 12
    {
        left: { name:"Double-Barrel Modification", icon:"\u{1F52B}", desc:"Twice the tubes, twice the fun.", effect:"Max Missiles +1", stat:"maxInterceptors", value:1 },
        right: { name:"Redistribute Colonel's Wine", icon:"\u{1F377}", desc:"He'll never notice. He's always like that.", effect:"Morale +1", stat:"morale", value:1 },
    },
    // After Level 13
    {
        left: { name:"Overclock the Autoloader", icon:"\u{26A1}", desc:"Voided the warranty? What warranty?", effect:"Reload Speed +1", stat:"reload", value:1 },
        right: { name:"Base Renovation", icon:"\u{1F3D7}", desc:"Added a patio. Also fixed the structural damage.", effect:"Repair +2 HP", stat:"repair", value:2 },
    },
    // After Level 14
    {
        left: { name:"Nitroglycerin Warheads", icon:"\u{1F4A5}", desc:"Handle with... actually, don't handle at all.", effect:"Firepower +1", stat:"firepower", value:1 },
        right: { name:"Promote Everyone", icon:"\u{2B50}", desc:"You're a colonel, you're a colonel, EVERYONE is a colonel.", effect:"Morale +1", stat:"morale", value:1 },
    },
    // After Level 15
    {
        left: { name:"Stolen Enemy Rocket Plans", icon:"\u{1F4DC}", desc:"Their missiles are faster for a reason.", effect:"Missile Speed +1", stat:"speed", value:1 },
        right: { name:"Mandatory Yoga Sessions", icon:"\u{1F9D8}", desc:"Namaste, then blast away.", effect:"Reload Speed +1", stat:"reload", value:1 },
    },
    // After Level 16
    {
        left: { name:"Strap Boosters to Boosters", icon:"\u{1F680}", desc:"Yo dawg, I heard you like thrust.", effect:"Missile Speed +1", stat:"speed", value:1 },
        right: { name:"Commission Theme Song", icon:"\u{1F3B5}", desc:"It slaps. The enemy hates it.", effect:"Morale +2", stat:"morale", value:2 },
    },
    // After Level 17
    {
        left: { name:"Nuclear Tips (Shhh)", icon:"\u{2622}", desc:"The Geneva Convention is more of a suggestion.", effect:"Firepower +2", stat:"firepower", value:2 },
        right: { name:"Emergency Repair Crew", icon:"\u{1F6E0}", desc:"They work fast when properly motivated.", effect:"Repair +2, Reload +1", stat:"repairPlusReload", value:1 },
    },
    // After Level 18
    {
        left: { name:"Mount Every Launcher", icon:"\u{1F4AA}", desc:"Structurally questionable. Spiritually essential.", effect:"Max Missiles +2", stat:"maxInterceptors", value:2 },
        right: { name:"War Bonds Concert", icon:"\u{1F3B8}", desc:"The band was mediocre. The patriotism was not.", effect:"Morale +2, Score +1", stat:"morale", value:2 },
    },
    // After Level 19 (Before final boss)
    {
        left: { name:"THE BIG ONE", icon:"\u{1F4A3}", desc:"The explosion will have its own explosion.", effect:"Firepower +3", stat:"firepower", value:3 },
        right: { name:"Inspire the Troops", icon:"\u{1F31F}", desc:"Your speech brought tears. And readiness.", effect:"All Stats +1", stat:"allStats", value:1 },
    },
];
