/**
 * Single source-of-truth for all decision chips.
 *
 * Design principles:
 * - 8 categories covering the full range of life decisions
 * - 6 chips per section — enough coverage without overwhelming
 * - Pull chips shown BEFORE worry chips in the UI (desire before fear)
 * - Chip text is first-person and emotionally specific, not abstract buzzwords
 * - Every chip maps to at least one archetype rule in the resolver
 */

export const DECISION_CATEGORIES = [
  {
    category: 'Work & Career',
    pulls: [
      'More Freedom',
      'Real Growth',
      'Respect & Recognition',
      'Sense of Purpose',
      'Better Income',
      'Using My Strengths'
    ],
    worries: [
      'Burning Out',
      'Not Good Enough',
      'Missing My Window',
      'Career Risk',
      'Conflict at Work',
      'Regretting Not Trying'
    ],
    actions: [
      'Stay Where I Am',
      'Make the Move',
      'Step Away for Now',
      'Explore My Options',
      'Pursue Change',
      'Push Through It'
    ]
  },
  {
    category: 'Money',
    pulls: [
      'More Security',
      'More Freedom',
      'Building Wealth',
      'Status & Image',
      'Enjoying It Now',
      'Getting Ahead'
    ],
    worries: [
      "Can't Afford It",
      'Too Risky',
      'Going Into Debt',
      'Feels Restrictive',
      "Won't Stick to It",
      'Missing an Opportunity'
    ],
    actions: [
      'Hold Back',
      'Spend Freely',
      'Start Small',
      'Grow Wealth',
      'Wait and Review',
      'Get Advice First'
    ]
  },
  {
    category: 'Health & Body',
    pulls: [
      'More Energy',
      'Feeling Stronger',
      'Looking Better',
      'Living Longer',
      'Mental Clarity',
      'Getting Out of Pain'
    ],
    worries: [
      "Won't Keep It Up",
      'Health Risk',
      'Too Hard to Maintain',
      'Low Energy',
      'Not Seeing Results',
      'Pushing Too Hard'
    ],
    actions: [
      'Push Harder',
      'Go Slowly',
      'Recover & Rest',
      'Find Balance',
      'Seek Help',
      'Stay Consistent'
    ]
  },
  {
    category: 'Focus & Habits',
    pulls: [
      'Getting Things Done',
      'Feeling in Control',
      'Building Momentum',
      'Less Guilt',
      'Clarity',
      'Proving It to Myself'
    ],
    worries: [
      "Won't Follow Through",
      'Overwhelmed',
      'Hard to Start',
      'Might Get Distracted',
      'Too Much at Once',
      'No Real Progress'
    ],
    actions: [
      'Lock In',
      'Ease Up',
      'Start Smaller',
      'Regain Control',
      'Build Momentum',
      'Let It Go for Now'
    ]
  },
  {
    category: 'Relationships',
    pulls: [
      'Feeling Closer',
      'Love & Intimacy',
      'Belonging',
      'Security',
      'Building Something Real',
      'Being Honest'
    ],
    worries: [
      'Getting Hurt',
      'Rejection',
      'Losing Them',
      'Being Judged',
      'Can I Trust This?',
      'Crossing a Line'
    ],
    actions: [
      'Move Closer',
      'Pull Back',
      'Open Up',
      'Have the Conversation',
      'Set a Boundary',
      'Wait and See'
    ]
  },
  {
    category: 'Identity & Growth',
    pulls: [
      'Becoming Who I Want to Be',
      'Curiosity & Exploration',
      'Making an Impact',
      'Expressing Myself',
      'Fulfillment',
      'Not Wasting My Potential'
    ],
    worries: [
      'Self-Doubt',
      'Not Being Ready',
      'Losing Who I Am',
      'Wasting Time',
      'Failing Publicly',
      'Lack of Direction'
    ],
    actions: [
      'Commit Deeply',
      'Explore More',
      'Let Go of What Isn\'t Working',
      'Express Myself',
      'Find Direction',
      'Give It More Time'
    ]
  },
  {
    category: 'Life & Environment',
    pulls: [
      'A Fresh Start',
      'More Comfort',
      'Stability',
      'Simpler Life',
      'Space to Breathe',
      'Feeling at Home'
    ],
    worries: [
      'Feels Chaotic',
      'Wrong Place for Me',
      'Too Much Upkeep',
      'Hard to Maintain',
      'Feeling Overwhelmed',
      'Won\'t Feel Right'
    ],
    actions: [
      'Make the Change',
      'Simplify',
      'Redesign It',
      'Stabilize',
      'Let Go of Something',
      'Give It More Time'
    ]
  },
  {
    category: 'Family & Big Life',
    pulls: [
      'Being There for People',
      'Creating Something Lasting',
      'Doing the Right Thing',
      'Growing Together',
      'A Deeper Purpose',
      'Belonging & Connection'
    ],
    worries: [
      'Not the Right Time',
      'Too Much Responsibility',
      'Letting Someone Down',
      'It\'ll Change Everything',
      'Making the Wrong Call',
      'Not Being Enough'
    ],
    actions: [
      'Move Forward',
      'Hold Off',
      'Have the Honest Conversation',
      'Get Clarity First',
      'Accept It',
      'Trust the Process'
    ]
  }
];
