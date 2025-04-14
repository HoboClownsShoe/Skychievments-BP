export const MILESTONES = {
    "mining_milestones": [  
    {
        id: "mc1",
        type: "milestone",
        level: "beginner",
        parentId: "mining_milestones",
        displayName: "Do you even Mine!!",
        description: "prove you mining prowess, get digging",
        lore : "this is displayed when hovering over the quest",
        icon: "textures/ui/groupIcons/hammer.png",  
        slot: 10,
        isHidden: true,
        collections: [  // collecitons that are part of this milestone
            {
                id: "mc1_1",
                tier: 1,
                slot: 10,
                displayName: "Miner I",
                description: "Mine any block",
                icon: "textures/items/iron_pickaxe",
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "onBreak",  
                        itemId: "minecraft:cobblestone",
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: "comamnd",
                        command: "effect @p haste 300 1"
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Well done, you mined a block!! \nHere have §g10 points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "mc1_2",
                type: "milestone",
                tier: 2,
                slot: 12,
                displayName: "Stone Miner II",
                description: "Mine 5 cobblestone blocks\n Collect 64 sand",
                icon: "textures/items/iron_pickaxe",
                commands: [{}],
                requirements: [
                    {
                        type: "onBreak",
                        itemId: "minecraft:cobblestone",
                        amount: 5
                    },
                    {
                        type: "collect",
                        itemId: "minecraft:sand",
                        amount: 64
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 15
                    },
                    {
                        type: "item",
                        itemId: "minecraft:coal_block",
                        amount: 1,
                        displayText: "1x Block of Coal"
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Woohoo 5 cobble in the bag \nHere have §g15 points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "mc1_3",
                type: "milestone",
                tier: 3,
                slot: 14,
                displayName: "Stone Miner III",
                description: "Mine 10 cobblestone blocks",
                icon: "textures/items/iron_pickaxe",
                commands: [{}],
                requirements: [
                    {
                        type: "onBreak",
                        itemId: "minecraft:cobblestone",
                        amount: 10
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 25
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Wow, that 10 now \nHere have §g25 points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "mc1_4",
                type: "milestone",
                tier: 4,
                slot: 16,
                displayName: "Stone Miner IV",
                description: "Mine 1000 cobblestone blocks",
                icon: "textures/items/iron_pickaxe",
                commands: [{}],
                requirements: [
                    {
                        type: "onBreak",
                        itemId: "minecraft:cobblestone",
                        amount: 1000
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 50
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: '1000 cobble, you are a machine \nHere have §g50 points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "mc1_5",
                type: "milestone",
                tier: 5,
                slot: 28,
                displayName: "Stone Miner V",
                description: "Mine 10K cobblestone blocks",
                icon: "textures/items/iron_pickaxe",
                commands: [{}],
                strings: [{}],
                requirements: [
                    {
                        type: "onBreak",
                        itemId: "minecraft:cobblestone",
                        amount: 10000
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 75
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: '10K cobble!!! Are you cheating \nHere have §g75 points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "mc1_6",
                type: "milestone",
                tier: 6,
                slot: 30,
                displayName: "Stone Miner VI",
                description: "Mine 100K cobblestone blocks",
                icon: "textures/items/iron_pickaxe",
                commands: [{}],
                requirements: [
                    {
                        type: "onBreak",
                        itemId: "minecraft:cobblestone",
                        amount: 100000
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 100
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Hang on, is that really 100K cobble \nHere have §g100 points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "mc1_7",
                type: "milestone",
                tier: 7,
                slot: 32,
                displayName: "Stone Miner VII",
                description: "Mine 1M cobblestone blocks",
                icon: "textures/items/iron_pickaxe",
                commands: [{}],
                requirements: [
                    {
                        type: "onBreak",
                        itemId: "minecraft:cobblestone",
                        amount: 1000000
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 200
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Slowdown champ!! where are you putting it all \nHere have §g200 points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "mc1_8",
                type: "milestone",
                tier: 8,
                slot: 34,
                displayName: "Stone Miner VIII",
                description: "Mine 2M cobblestone blocks",
                icon: "textures/items/iron_pickaxe",
                commands: [{}],
                strings: [{}],
                requirements: [
                    {
                        type: "onBreak",
                        itemId: "minecraft:cobblestone",
                        amount: 2000000
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 500
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: '2M cobble, who needs that much cobble stone!! \nHere have §g500 points§r',
                        messageType: 'toast'
                    },
                ]
            }
        ],
        options: {
            // "prerequisites":[
            //     {
            //         "id" : "cobblestone_1"  // quests needed to be completed first
            //     }
            // ],
            activatedBy: ["itb1_3"],
            cancellable: false,  // can you cancel the quest
            repeatable: {  // can you repeat the quest
                enabled : false,
                cooldown : 10  // how long to wait before repeating
            },
            timeLimit: 0, // in minutes
            enabled: true,
            order: 0
        }   
    }
    ],
    "toolBreaker": [
        {
            id: "tb1",
            type: "milestone",
            level: "beginner",
            parentId: "toolBreaker",
            displayName: "Gotta break them all",
            description: "Break all types of tools",
            lore : "lore Lore l0re",
            icon: "textures/ui/groupIcons/iron_sword_3.png",
            slot: 11,
            isHidden: true, 
            collections: [                 
                {
                    id: "tb1_1",
                    tier: 1,
                    slot: 13,
                    displayName: "like a twig",
                    description: "break all wodden tools",
                    icon: "textures/ui/QuestIcons/wooden_sword_3.png",
                    type: "",
                    reference: {
                        milestoneId: "",
                        mode: ""   
                    },
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "allBrokenToolInCategory",  
                            category: "woodenTool",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'you vandal\nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
                {
                    id: "tb1_2",
                    tier: 2,
                    slot: 31,
                    displayName: "stone a crows",
                    description: "break all stone tools",
                    icon: "textures/ui/QuestIcons/stone_sword_3.png",
                    type: "",
                    reference: {
                        milestoneId: "",
                        mode: ""   
                    },
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "allBrokenToolInCategory",  
                            category: "stoneTool",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'you vandal\nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
                {
                    id: "tb1_3",
                    tier: 3,
                    slot: 49,
                    displayName: "Iron Man",
                    description: "break all iron tools",
                    icon: "textures/ui/QuestIcons/iron_sword_3.png",
                    type: "",
                    reference: {
                        milestoneId: "",
                        mode: ""   
                    },
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "allBrokenToolInCategory",  
                            category: "ironTool",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'you vandal\nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
                {
                    id: "tb1_4",
                    tier: 4,
                    slot: 67,
                    displayName: "Dimonds Done",
                    description: "break all diamond tools",
                    icon: "textures/ui/QuestIcons/diamond_sword_3.png",
                    type: "",
                    reference: {
                        milestoneId: "",
                        mode: ""   
                    },
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "allBrokenToolInCategory",  
                            category: "diamondTool",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'you vandal\nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
                {
                    id: "tb1_5",
                    tier: 5,
                    slot: 85,
                    displayName: "Never.....",
                    description: "break all netherite tools",
                    icon: "textures/ui/QuestIcons/netherite_sword_3.png",
                    type: "",
                    reference: {
                        milestoneId: "",
                        mode: ""   
                    },
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "allBrokenToolInCategory",  
                            category: "netheriteTool",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'you vandal\nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                }                    
            ],
            options: {
            // "prerequisites":[
            //     {
            //         "id" : "cobblestone_1"  // quests needed to be completed first
            //     }
            // ],
            activatedBy: ["itb1_10"],
            cancellable: false,  // can you cancel the quest
            repeatable: {  // can you repeat the quest
                enabled : false,
                cooldown : 10  // how long to wait before repeating
            },
            timeLimit: 0, // in minutes
            enabled: true,
            order: 0
            }        
        }
    ],
    "murder_milestones":[
        {
        id: "mr1",
        type: "milestone",
        level: "beginner",
        parentId: "murder_milestones",
        displayName: "Are you a cold blooded killer??",
        description: "",
        lore : "Redrum",
        icon: "textures/ui/groupIcons/sword.png", 
        slot: 12,
        isHidden: true,
        collections: [  // collecitons that are part of this milestone
            {
                id: "mr1_1",
                tier: 1,
                slot: 13,
                displayName: "Murder I",
                description: "Kill 10 cows",
                icon: "textures/items/diamond_sword",
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "anyMob",  
                        itemId: "minecraft:cow",
                        amount: 10
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'dang....you crazy man \nHere have §g500 points§r',
                        messageType: 'toast'
                    },
                ]
            }
        ],
        options: {
            // "prerequisites":[
            //     {
            //         "id" : "cobblestone_1"  // quests needed to be completed first
            //     }
            // ],
            activatedBy: ["itb1_17"],
            cancellable: false,  // can you cancel the quest
            repeatable: {  // can you repeat the quest
                enabled : false,
                cooldown : 10  // how long to wait before repeating
            },
            timeLimit: 0, // in minutes
            enabled: true,
            order: 0
        }     
        }
    ],
    "traveller_milestones":[
        {
        id: "tr1",
        type: "milestone",
        level: "beginner",
        parentId: "traveller_milestones",
        displayName: "Get them boots on!!",
        description: "",
        lore : "would you walk 1000 miles",
        icon: "textures/ui/groupIcons/boot.png",  
        slot: 13,
        isHidden: true,
        collections: [  // collecitons that are part of this milestone
            {
                id: "tr1_1",
                tier: 1,
                slot: 10,
                displayName: "Walker I",
                icon: "textures/items/iron_boots",
                description: "Walk 100 meters",
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "walk",  
                        itemId: "",
                        amount: 10000
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'blisters much!!! \nHere have §g10 points§r',
                        messageType: 'toast'
                    },
                ]
            }
        ],
        options: {
            // "prerequisites":[
            //     {
            //         "id" : "itb1"  // quests needed to be completed first
            //     }
            // ],
            activatedBy: ["mr1"],
            cancellable: false,  // can you cancel the quest
            repeatable: {  // can you repeat the quest
                enabled : false,
                cooldown : 10  // how long to wait before repeating
            },
            timeLimit: 0, // in minutes
            enabled: true,
            order: 0
        }     
        }
    ],
    "InTheBegining":[
        {
        id: "itb1",
        type: "milestone",
        level: "beginner",
        parentId: "InTheBegining",
        displayName: "In the beginning......",
        description: "So you've loaded up Minecraft, now what??",
        lore : "Step 1, Mine\nStep 2 erm....",
        icon: "textures/ui/QuestIcons/grass_block.png",
        background: "textures/ui/QuestBackgrounds/qaeInTheBeginning_v2", 
        slot: 456,
        isHidden: false,
        collections: [
            {
                id: "itb1_1",
                tier: 1,
                slot: 444,
                displayName: "Touch Grass",
                description: "Get on your knees and Dig!!",
                icon: "textures/ui/QuestIcons/grass_block.png",                
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "onBreakAnyInCategory",  
                        category: "dirt",
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Its under my Nails\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_2",
                tier: 2,
                slot: 447,
                displayName: "Punching Wood",
                description: "Break you first log\nAny log will do",
                icon: "textures/ui/QuestIcons/oak_log.png",                
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "onBreakAnyInCategory",  
                        category: "log",
                        amount: 10
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'How are those knuckles?\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_3",
                tier: 3,
                slot: 450,
                displayName: "Getting Crafty",
                description: "Place down your first of many Crafting tables",
                icon: "textures/ui/QuestIcons/crafting_table.png",
                unlockedBy: 2,
                type: "",
                reference: {
                    milestoneId: "",
                    mode: ""   
                },
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "onPlace",  
                        itemId: "minecraft:crafting_table",
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'One of many...\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_4",
                tier: 4,
                slot: 454,
                displayName: "You never forget your first",
                description: "Craft some wooden tools",
                icon: "textures/ui/QuestIcons/wood_pickaxe.png",
                unlockedBy: 3,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "collectAnyInCategory",  
                        category: "woodenTools",
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Woohoo, sharpend wooden things, dont you feel like a man!!\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_5",
                tier: 5,
                slot: 577,
                displayName: "Humble Bumble",
                description: "Craft a Bundle\nTotally doesnt look like an elephants scrotum",
                icon: "textures/ui/QuestIcons/bundle.png",
                unlockedBy: 3,
                type: "",
                reference: {
                    milestoneId: "",
                    mode: ""   
                },      
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "collect",  
                        itemId: "minecraft:bundle",
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Scrotum Storage Aquired\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_6",
                tier: 6,
                slot: 766,
                displayName: "Nap Time",
                description: "You've worked hard, place a bed, take a nap",
                icon: "textures/ui/QuestIcons/bed_red.png",
                unlockedBy: 3,
                type: "",
                reference: {
                    milestoneId: "",
                    mode: ""   
                },               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "onPlaceAnyInCategory",  
                        category: "beds",
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'One sheep, Two Sheep, zzzzzzzzzzz\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_7",
                tier: 7,
                slot: 672,
                displayName: "Stationary Storage",
                description: "Pockets full of crap??, Craft and place a chest for storing your usless junk",
                icon: "textures/ui/QuestIcons/chest.png",
                unlockedBy: 3,
                type: "",
                reference: {
                    milestoneId: "",
                    mode: ""   
                },               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "onPlaceAnyInCategory",  
                        category: "storage",
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'where did i put my........ it was right here\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_8",
                tier: 8,
                slot: 582,
                displayName: "Hot Topic",
                description: "Gotta get cookin\n\n Place down a furnace",
                icon: "textures/ui/QuestIcons/furnace.png",
                unlockedBy: 3,
                type: "",
                reference: {
                    milestoneId: "",
                    mode: ""   
                },               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "onPlace",  
                        itemId: "minecraft:furnace",
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Sizzle sizzle\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_9",
                tier: 9,
                slot: 457,
                displayName: "Getting an Upgrade",
                description: "You've hit the StoneAge, upgrade that tool belt\n\nCraft Stone Tools",
                icon: "textures/ui/QuestIcons/stone_pickaxe.png",
                unlockedBy: 3, 
                type: "",
                reference: {
                    milestoneId: "",
                    mode: ""   
                },              
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "collectAnyInCategory",  
                        category: "stoneTools",
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Manly rocks tied to sticks!\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_10",
                tier: 10,
                slot: 580,
                displayName: "awwww, it broke!",
                description: "smash shit till it breaks in you hand! simples\n\nBreak any of you tools",
                icon: "textures/ui/QuestIcons/wooden_pickaxe_2.png",
                unlockedBy: 4,
                type: "",
                reference: {
                    milestoneId: "",
                    mode: ""   
                },               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "anyBrokenToolInCategory",  
                        category: "tools",
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Hope you didnt get a Splinter\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_11",
                tier: 11,
                slot: 633,
                displayName: "Stayin' Alive",
                description: "Survive a whole day and night\n\nDont die, simples",
                icon: "textures/ui/QuestIcons/clock_item.png",
                unlockedBy: 1,
                type: "",
                reference: {
                    milestoneId: "",
                    mode: ""   
                },               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "timePassedSince",
                        event: "tier_activated",                          
                        tier_id: "itb1_11",
                        milestoneId: "itb1",
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'The BeeGees would be proud, well...the one thats alive would be\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_12",
                tier: 12,
                slot: 709,
                displayName: "Nom Nom Nom",
                description: "Catch it, Kill It, Cook it\n\nEat cooked food",
                icon: "textures/ui/QuestIcons/chicken_cooked.png",
                unlockedBy: [8,13],               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "onEatAnyInCategory",
                        category: "cookedFood",                          
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'MMmmmmmmmmmmeatttttttt\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_13",
                tier: 13,
                slot: 584,
                displayName: "COAL!! always believe in your soul! ",
                description: "its just squished up dinosaurs\n\nMine some coal ore",
                icon: "textures/ui/QuestIcons/coal.png",
                unlockedBy: 9,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "onBreak",
                        itemId: "minecraft:coal_ore",                      
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Tell me you got the song reference\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_14",
                tier: 14,
                slot: 322,
                displayName: "Crop-ping all day",
                description: "Get in them there fields\n\nObtain some crops",
                icon: "textures/ui/QuestIcons/wheat.png",
                unlockedBy: 2,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "collectAnyInCategory",
                        category: "crops",                          
                        amount: 16
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Back breaking work\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_15",
                tier: 15,
                slot: 320,
                displayName: "Forrestry",
                description: "Stop the deforestation, replant what you cut down\n\nObtain one of the saplings",
                icon: "textures/ui/QuestIcons/sapling_oak.png",
                unlockedBy: 2,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "collectAnyInCategory",
                        category: "saplings",                          
                        amount: 8
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Gaia will be pleased\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_16",
                tier: 16,
                slot: 264,
                displayName: "Arrrgghh Kill it",
                description: "There be scary things in the dark, kill them\n\nSlaughter a hostile mob",
                icon: "textures/ui/QuestIcons/rotten_flesh.png",
                unlockedBy: 4,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "killAnyInCategory",
                        category: "hostileMobs",                          
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'One down, soooooo many more to go\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_17",
                tier: 17,
                slot: 266,
                displayName: "Its got to be done, just dont look",
                description: "Sometimes animal die\n\nKill a passive mob",
                icon: "textures/ui/QuestIcons/egg_cow.png",
                unlockedBy: 4,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "killAnyInCategory",
                        category: "passiveMobs",                          
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'How do you feel now?? Like a Man/Woman\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_18",
                tier: 18,
                slot: 460,
                displayName: "Hard Rock and METALLLLLLL!!!",
                description: "Get to smelting some ingots\n\nGet some Iron or Copper ingots",
                icon: "textures/ui/QuestIcons/iron_ingot.png",
                unlockedBy: 8,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "collectAnyInCategory",
                        category: "metalIngots",                          
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'You did it \nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_19",
                tier: 19,
                slot: 586,
                displayName: "Iron Mans utensils",
                description: "Upgrade your tools to the Iron Age\n\nCraft all the Iron Tools and Weapons",
                icon: "textures/ui/QuestIcons/iron_pickaxe.png",
                unlockedBy: 18,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "collectAllInCategory",
                        category: "ironTools",                          
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'I am Iron Man\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_20",
                tier: 20,
                slot: 463,
                displayName: "oooooh Shiney",
                description: "Find your first diamonds, they're blue, you can miss them\n\nMine some Diamond ore",
                icon: "textures/ui/QuestIcons/diamond.png",
                unlockedBy: 18,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "onBreak",
                        itemId: "minecraft:diamond_ore",                          
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Thank god it wasnt lapis\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_21",
                tier: 21,
                slot: 712,
                displayName: "Now we're progressing",
                description: "Find that red stuff in the rocks\n\nMine some Redstone ore",
                icon: "textures/ui/QuestIcons/redstone_dust.png",
                unlockedBy: 18,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "onBreak",
                        itemId: "minecraft:lit_redstone_ore",                          
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'So many possibilities\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_22",
                tier: 22,
                slot: 337,
                displayName: "Careful, they're sharp",
                description: "Get them rusty old tools chucked out, Get some shiney new blue ones\n\nCraft some Diamond Tools",
                icon: "textures/ui/QuestIcons/diamond_sword.png",
                unlockedBy: 20,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "collectAnyInCategory",
                        category: "diamondTools",                          
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: ' Nothing can stop me now!!\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_23",
                tier: 23,
                slot: 466,
                displayName: "Its hot, Its dangerous, Its very Red",
                description: "Just close your eyes and jump in\n\nGo into the Nether",
                icon: "textures/ui/QuestIcons/flint_and_steel.png",
                unlockedBy: 18,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "dimensionChange",
                        dimension: "minecraft:nether",
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Careful, its hot in there\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_24",
                tier: 24,
                slot: 593,
                displayName: "Star of wonder, Star of Light",
                description: "Dead easy, just kill the wither\n\nObtain a Nether Star",
                icon: "textures/ui/QuestIcons/nether_star.png",
                unlockedBy: 23,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "collect",
                        itemId: "minecraft:nether_star",                          
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Just one more boss to go\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_25",
                tier: 25,
                slot: 719,
                displayName: "Chuck it and see",
                description: "Craft up some Ender Eyes to hunt down the stringhold\n\nObtain some Eyes of Ender",
                icon: "textures/ui/QuestIcons/ender_eye.png",
                unlockedBy: 23,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "collect",
                        itemId: "minecraft:ender_eye",                          
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'I hope you have enough\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            },
            {
                id: "itb1_26",
                tier: 26,
                slot: 470,
                displayName: "Nothing to see here",
                description: "Get to the End",
                icon: "textures/ui/QuestIcons/end_portal_frame.png",
                unlockedBy: 25,               
                commands: [{}],  // commands to run
                requirements: [
                    {
                        type: "dimensionChange",
                        dimension: "minecraft:the_end",                          
                        amount: 1
                    }
                ],
                rewards: [
                    {
                        type: "point",
                        amount: 10
                    },
                    {
                        type: 'message',
                        stage: 'complete',
                        content: 'Dont look down\nHere have §g10 Quest Points§r',
                        messageType: 'toast'
                    },
                ]
            }
            
        ],
        //     {
        //         id: "b1_1",
        //         tier: 1,
        //         slot: 70,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_2",
        //         tier: 2,
        //         slot: 71,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_3",
        //         tier: 3,
        //         slot: 48,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_4",
        //         tier: 4,
        //         slot: 49,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_5",
        //         tier: 5,
        //         slot: 50,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_6",
        //         tier: 6,
        //         slot: 51,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_7",
        //         tier: 7,
        //         slot: 52,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_8",
        //         tier: 8,
        //         slot: 53,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_9",
        //         tier: 9,
        //         slot: 54,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_10",
        //         tier: 10,
        //         slot: 55,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_11",
        //         tier: 11,
        //         slot: 56,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_12",
        //         tier: 12,
        //         slot: 57,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_13",
        //         tier: 13,
        //         slot: 58,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_14",
        //         tier: 14,
        //         slot: 59,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_15",
        //         tier: 15,
        //         slot: 60,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_16",
        //         tier: 16,
        //         slot: 61,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_17",
        //         tier: 17,
        //         slot: 62,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_18",
        //         tier: 18,
        //         slot: 63,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_19",
        //         tier: 19,
        //         slot: 63,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_20",
        //         tier: 20,
        //         slot: 64,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_21",
        //         tier: 21,
        //         slot: 65,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_22",
        //         tier: 22,
        //         slot: 66,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_23",
        //         tier: 23,
        //         slot: 67,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_24",
        //         tier: 24,
        //         slot: 68,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        //     {
        //         id: "b1_25",
        //         tier: 25,
        //         slot: 69,
        //         displayName: "Punching Wood",
        //         description: "break you first log",
        //         icon: "textures/items/cake.png",                
        //         commands: [{}],  // commands to run
        //         requirements: [
        //             {
        //                 type: "anyInCategory",  
        //                 category: "log",
        //                 amount: 1
        //             }
        //         ],
        //         rewards: [
        //             {
        //                 type: "point",
        //                 amount: 10
        //             },
        //             {
        //                 type: 'message',
        //                 stage: 'complete',
        //                 content: 'How are those knuckles?\nHere have §g10 points§r',
        //                 messageType: 'toast'
        //             },
        //         ]
        //     },
        // ],
        options: {
          //  prerequisites:[
          //      {
          //          id : "cobblestone_1"  // quests needed to be completed first
          //      }
          //  ],
            activatedBy: [],
            cancellable: false,  // can you cancel the quest
            repeatable: {  // can you repeat the quest
                enabled : false,
                cooldown : 10  // how long to wait before repeating
            },
            timeLimit: 0, // in minutes
            enabled: true,
            order: 0
        }   
        }
    ],
    "HiHoHiHo": [
        {
            id: "hh1",
            type: "milestone",
            level: "beginner",
            parentId: "HiHoHiHo",
            displayName: "Hi Ho Hi Ho",
            description: "It's off to work we go",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/stone_pickaxe.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 645,
            isHidden: false,
            collections: [
                {
                    id: "hhh1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
                {   // this refereneced milestone is here to populate the UI
                    // the "mc1" milestone isnt active until this tier is processed, it will be completed by defualt as it has no requirements
                    // one this tier is reached the milestone will become active and will be activly checked in each loop along side all other milestones
                    id: "b1_5",
                    tier: 5,
                    slot: 42,
                    displayName: "Now get to mining!!",
                    description: "",
                    icon: "textures/ui/QuestIcons/wooden_pickaxe_0.png",
                    unlockedBy: 4, 
                    type: "milestone_reference",
                    reference: {
                        milestoneId: "mc1",
                        mode: "parallel"   
                    },
                    commands: [{}],  // commands to run
                    requirements: [],
                    rewards: [                    
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'You\'ve unlocked the Mining achievements!\nComplete them at your own pace.',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_3"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "WoodenItBeNice": [
        {
            id: "wibn1",
            type: "milestone",
            level: "beginner",
            parentId: "WoodenItBeNice",
            displayName: "Wooden it be nice",
            description: "Forestry 101",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/sapling_oak.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 167,
            isHidden: false,
            collections: [
                {
                    id: "wibn1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_15"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "PloughTastic": [
        {
            id: "omd1",
            type: "milestone",
            level: "beginner",
            parentId: "PloughTastic",
            displayName: "Plough-tastic",
            description: "Good old fashioned back breaking hard work",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/wheat.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 745,
            isHidden: false,
            collections: [
                {
                    id: "omd1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_14"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "GettingCrafty": [
        {
            id: "gc1",
            type: "milestone",
            level: "beginner",
            parentId: "GettingCrafty",
            displayName: "Time to Get Crafty",
            description: "in a game of 2 words, this is the second",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/crafting_table.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 368,
            isHidden: false,
            collections: [
                {
                    id: "eka1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_2"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "KitchenNightmares": [
        {
            id: "kn1",
            type: "milestone",
            level: "beginner",
            parentId: "KitchenNightmares",
            displayName: "Hobo's Kitchen Nightmares",
            description: "Like Ramsey, but digital.  and better, much better",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/chicken_cooked.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 356,
            isHidden: false,
            collections: [
                {
                    id: "kn1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_12"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "AdventureTime": [
        {
            id: "at1",
            type: "milestone",
            level: "beginner",
            parentId: "AdventureTime",
            displayName: "Adventure Time",
            description: "Head out and find stuff",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/compass_item.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 202,
            isHidden: false,
            collections: [
                {
                    id: "at1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_1"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "RedStoner": [
        {
            id: "rs1",
            type: "milestone",
            level: "beginner",
            parentId: "RedStoner",
            displayName: "RedStoner 420",
            description: "Automica Mechanicus",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/redstone_dust.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 805,
            isHidden: false,
            collections: [
                {
                    id: "rs1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_21"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "YouNetherForget": [
        {
            id: "ynf1",
            type: "milestone",
            level: "beginner",
            parentId: "YouNetherForget",
            displayName: "You Nether Forget",
            description: "Its Hot, Its dangerous, it red",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/netherrack.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 640,
            isHidden: false,
            collections: [
                {
                    id: "ynf1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_23"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "EndGame": [
        {
            id: "eg1",
            type: "milestone",
            level: "beginner",
            parentId: "EndGame",
            displayName: "End Game",
            description: "Nothing to see here, except a fricking Dragon",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/end_portal_frame.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 514,
            isHidden: false,
            collections: [
                {
                    id: "eg1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_23"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "HunterKiller": [
        {
            id: "hk1",
            type: "milestone",
            level: "beginner",
            parentId: "HunterKiller",
            displayName: "Hunter Killer",
            description: "There be monters in the shadows",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/rotten_flesh.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 556 ,
            isHidden: false,
            collections: [
                {
                    id: "hk1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_16"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "OldMcDonald": [
        {
            id: "omd1",
            type: "milestone",
            level: "beginner",
            parentId: "OldMcDonald",
            displayName: "Old McDonlald had a...",
            description: "Not everything is trying to kill you",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/egg_cow.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 651,
            isHidden: false,
            collections: [
                {
                    id: "pm1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_17"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "GearUp": [
        {
            id: "gu1",
            type: "milestone",
            level: "beginner",
            parentId: "GearUp",
            displayName: "Gear Up",
            description: "Arm yourself",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/diamond_sword.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 769,
            isHidden: false,
            collections: [
                {
                    id: "gu1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_22"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "GreenFingerdNinja": [
        {
            id: "gfn1",
            type: "milestone",
            level: "beginner",
            parentId: "GreenFingerdNinja",
            displayName: "Green Fingered Ninja",
            description: "One with nature again, Gia will be happy",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/flower_tulip_orange.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 261,
            isHidden: false,
            collections: [
                {
                    id: "gfn1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_1"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "TimeToQuest": [
        {
            id: "ttq1",
            type: "milestone",
            level: "beginner",
            parentId: "TimeToQuest",
            displayName: "Time To Quest",
            description: "Start the clock",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/clock_item.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 141,
            isHidden: false,
            collections: [
                {
                    id: "ttq1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Two Minutes",
                    description: "Minute two",
                    icon: "textures/ui/QuestIcons/clock_item.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "timePassedSince",  
                            event: "milestone_activated",
                            milestoneId: "ttq1",
                            amount: 2
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Thats two minutes \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
                {
                    id: "ttq1_2",
                    tier: 2,
                    slot: 41,
                    displayName: "Three Minutes",
                    description: "Minute Three",
                    icon: "textures/ui/QuestIcons/clock_item.png",                
                    unlockedBy: 1,
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "timePassedSince",  
                            event: "milestone_activated",
                            milestoneid: "ttq1",
                            amount: 2
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Thats Three minutes \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                }
            ],
            options: {
                activatedBy: ["itb1_11"], // activated when the survive 1 min is activated
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ],
    "JustStats": [
        {
            id: "js1",
            type: "milestone",
            level: "beginner",
            parentId: "JustStats",
            displayName: "Just Stats",
            description: "Start the clock",
            lore : "Lore Lore Lore",
            icon: "textures/ui/QuestIcons/stats_book.png",
            background: "textures/ui/QuestBackgrounds/chestUI_90", 
            slot: 209,
            isHidden: false,
            collections: [
                {
                    id: "js1_1",
                    tier: 1,
                    slot: 40,
                    displayName: "Test One!",
                    description: "Description One",
                    icon: "textures/ui/QuestIcons/oak_log.png",                
                    commands: [{}],  // commands to run
                    requirements: [
                        {
                            type: "onBreak",  
                            category: "minecraft:stone",
                            amount: 1
                        }
                    ],
                    rewards: [
                        {
                            type: "point",
                            amount: 10
                        },
                        {
                            type: 'message',
                            stage: 'complete',
                            content: 'Well done \nHere have §g10 points§r',
                            messageType: 'toast'
                        },
                    ]
                },
            ],
            options: {
                activatedBy: ["itb1_1"],
                cancellable: false,
                repeatable: {
                    enabled: false,
                    cooldown: 10
                },
                timeLimit: 0,
                enabled: true,
                order: 0
            }
        }
    ]

};
