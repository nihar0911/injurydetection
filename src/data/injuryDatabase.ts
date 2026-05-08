export interface InjuryPattern {
  condition: string;
  probabilityBase: number;
  thresholds: {
    minBruisePct: number;
    minRednessPct: number;
    maxKneeAngle?: number; // Less than this indicates restriction
    requiredSymptoms: string[]; // keywords
  };
  severityScoreBase: number;
  movementDecision: string;
  plan: string[];
  recoverySteps: { day: number; action: string; details: string }[];
}

const generateExtendedSteps = (condition: string) => {
  const steps = [];
  for (let d = 8; d <= 30; d++) {
    let action = "Progressive Tissue Loading";
    let details = "Execute your 30-minute tailored physical therapy routine. Focus on eccentric control and stability. Ensure you consume 20g of protein post-session.";
    
    if (d % 7 === 0) {
       action = "Biomechanical Check-In";
       details = "Perform a full range of motion assessment. If pain exceeds 2/10 during movement, regress to the previous week's load. Otherwise, safely increase resistance by 10%.";
    } else if (d % 4 === 0) {
       action = "Active Recovery Day";
       details = "No heavy loading today. Focus purely on blood flow: light stationary biking, swimming, contrast therapy (hot/cold), and deep tissue massage to flush lactic acid.";
    }

    if (condition.includes("Severe")) {
       action = "Strict Immobilization & Monitoring";
       details = "Continue following orthopedic surgeon instructions. Do not load the tissue. Upper body cardiovascular work is permitted if cleared.";
       if (d >= 21 && d % 7 === 0) {
          action = "Orthopedic Surgeon Follow-up";
          details = "Attend your scheduled clinical review. Likely time for cast/brace removal and transition into Phase 1 of post-op physical therapy.";
       } else if (d >= 21) {
          action = "Early Phase Rehab";
          details = "Begin initial physical therapy under professional supervision. Extremely gentle passive range of motion. Do not force any movements. Stop if you feel sharp pain.";
       }
    }

    steps.push({ day: d, action, details });
  }
  return steps;
};

export const INJURY_DATABASE: InjuryPattern[] = [
  {
    condition: "Grade II Structural Sprain / Strain",
    probabilityBase: 85,
    thresholds: {
      minBruisePct: 5,
      minRednessPct: 2,
      requiredSymptoms: ['swell', 'pain', 'bruis', 'pop', 'instab']
    },
    severityScoreBase: 60,
    movementDecision: "No movement",
    plan: ["Immobilize the joint", "Apply ice immediately", "Elevate limb above heart", "Do not bear weight"],
    recoverySteps: [
      { day: 1, action: "Complete Rest & Cryotherapy", details: "Apply ice packs wrapped in a thin towel for 15 minutes every 2 hours. Elevate the affected limb above the level of your heart to drain fluid and reduce swelling. Absolutely zero weight bearing." },
      { day: 2, action: "Compression & Strict Elevation", details: "Wrap the area firmly but not too tightly with an elastic compression bandage. Continue icing. Do not attempt to test the joint or walk on it. Focus on rest." },
      { day: 3, action: "Passive Range of Motion", details: "Remove the brace temporarily. Using your hands or a towel, gently move the joint through a pain-free arc of motion. Stop immediately if you feel a sharp pinch. Do 3 sets of 10 slow reps." },
      { day: 4, action: "Light Resistance Band Isometrics", details: "Attach a light resistance band. Push against the band without actually moving the joint (isometric hold). Hold the tension for 5 seconds, release. Do 3 sets of 8 holds to re-engage the muscle fibers safely." },
      { day: 5, action: "Partial Weight Bearing", details: "Using crutches or a support rail, gently apply 25% to 50% of your body weight onto the affected limb while standing. Assess your pain level. If pain is below a 3/10, practice shifting weight side-to-side." },
      { day: 6, action: "Proprioception & Balance", details: "Stand on one leg (the injured one) while holding a wall for support. Try to balance for 30 seconds. This rebuilds the neurological connection and joint stability. Do 5 sets." },
      { day: 7, action: "Biomechanical Load Testing", details: "Attempt a slow, controlled bodyweight squat, lunge, or jogging motion depending on the joint. The goal is to ensure full structural integrity under load before returning to full practice." },
      ...generateExtendedSteps("Grade II")
    ]
  },
  {
    condition: "Severe Structural Damage / Potential Fracture",
    probabilityBase: 92,
    thresholds: {
      minBruisePct: 15,
      minRednessPct: 10,
      maxKneeAngle: 90,
      requiredSymptoms: ['deform', 'bear weight', 'intense', 'bleed']
    },
    severityScoreBase: 85,
    movementDecision: "Immobilize immediately",
    plan: ["DO NOT MOVE THE ATHLETE", "Call emergency services", "Stabilize the area without realigning", "Control any bleeding"],
    recoverySteps: [
      { day: 1, action: "Emergency Medical Evaluation", details: "Go to the ER or urgent care immediately for X-Rays or MRI. Ensure the limb is splinted to prevent further vascular or nerve damage." },
      { day: 2, action: "Surgical Consult & Strict Rest", details: "Follow the orthopedic surgeon's exact protocol. If bracing or casting was applied, keep it completely dry and elevated to minimize throbbing." },
      { day: 3, action: "Strict Immobilization", details: "Do not attempt to move the injured area. Take prescribed anti-inflammatories. Focus on hydrating and eating a high-protein diet for tissue repair." },
      { day: 4, action: "Strict Immobilization", details: "Continue to rest. Monitor the extremities (fingers/toes) for color changes, numbness, or extreme coldness which could indicate compromised blood flow from swelling." },
      { day: 5, action: "Strict Immobilization", details: "Perform upper-body or non-affected limb exercises to maintain cardiovascular health if approved by your doctor, but keep the injured area completely still." },
      { day: 6, action: "Strict Immobilization", details: "Prepare for your follow-up orthopedic appointment. Write down any questions about pain levels, strange sensations, or timeline expectations." },
      { day: 7, action: "Orthopedic Review", details: "Attend your 1-week follow up. The doctor will likely take secondary imaging to ensure bones/ligaments have not shifted out of alignment." },
      ...generateExtendedSteps("Severe")
    ]
  },
  {
    condition: "Soft Tissue Micro-Trauma / Mild Strain",
    probabilityBase: 78,
    thresholds: {
      minBruisePct: 0,
      minRednessPct: 0,
      requiredSymptoms: ['stiff', 'tight', 'dull']
    },
    severityScoreBase: 20,
    movementDecision: "Limited movement",
    plan: ["Reduce immediate athletic activity", "Apply cold pack for 15 mins", "Monitor for swelling"],
    recoverySteps: [
      { day: 1, action: "Active Rest & Evaluation", details: "Stop the triggering activity. You don't need complete bed rest, but avoid running, jumping, or heavy lifting. Apply ice if there is a dull ache." },
      { day: 2, action: "Dynamic Stretching", details: "Perform slow, controlled dynamic stretches (like leg swings or arm circles). Do not hold static stretches, keep the blood flowing to the micro-tears to speed up healing." },
      { day: 3, action: "Return to 50% Load", details: "Engage in light activity (e.g., jogging if it's a leg issue, or light throwing if arm). Keep intensity to exactly 50% of your maximum effort. Stop if stiffness returns." },
      { day: 4, action: "Return to 75% Load", details: "Increase the intensity. Practice sport-specific drills (cutting, sprinting, swinging) at a moderate to high pace. Pay close attention to any mechanical compensations." },
      { day: 5, action: "Full Practice Participation", details: "Join standard practice. Inform your coach of the recent stiffness. Ensure you perform a highly thorough 15-minute warm-up before stepping on the field." },
      { day: 6, action: "Standard Athletic Performance", details: "You are cleared for 100% maximum effort. Implement post-training recovery protocols immediately after the session (foam rolling, massage gun)." },
      { day: 7, action: "Standard Athletic Performance", details: "Resume normal competitive schedule. Monitor the area for the next two weeks to prevent chronic recurring micro-traumas." },
      ...generateExtendedSteps("Mild")
    ]
  }
];

export const findMatchingCondition = (
  bruisePct: number, 
  rednessPct: number, 
  symptoms: string[], 
  kneeAngle: number | null
): InjuryPattern => {
  const symptomStr = symptoms.join(' ').toLowerCase();

  let bestMatch = INJURY_DATABASE[2];
  let highestScore = -1;

  for (const pattern of INJURY_DATABASE) {
    let score = 0;
    if (bruisePct >= pattern.thresholds.minBruisePct) score += 2;
    if (rednessPct >= pattern.thresholds.minRednessPct) score += 2;
    if (pattern.thresholds.maxKneeAngle && kneeAngle !== null && kneeAngle < pattern.thresholds.maxKneeAngle) score += 3;
    
    let symptomMatches = 0;
    for (const req of pattern.thresholds.requiredSymptoms) {
      if (symptomStr.includes(req)) symptomMatches++;
    }
    score += symptomMatches;

    if (score > highestScore) {
      highestScore = score;
      bestMatch = pattern;
    }
  }

  if (highestScore < 2) return INJURY_DATABASE[2];

  return bestMatch;
};
