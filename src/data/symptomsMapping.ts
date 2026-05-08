import { BodyPart } from '../types';

export const SYMPTOMS_BY_REGION: Record<string, string[]> = {
  head: ['Headache', 'Dizziness', 'Blurred Vision', 'Vomiting', 'Bleeding', 'Loss of Balance', 'Confusion', 'Light Sensitivity', 'Nausea', 'Blackout', 'Ringing Ears', 'Eye Pain'],
  neck: ['Neck Stiffness', 'Sharp Pain', 'Limited Rotation', 'Numbness', 'Tingling', 'Muscle Tightness', 'Swelling', 'Pain While Looking Down'],
  shoulder: ['Shoulder Pop', 'Clicking Sound', 'Limited Arm Movement', 'Sharp Pain', 'Weakness', 'Swelling', 'Bruising', 'Arm Instability', 'Pain While Lifting'],
  elbow: ['Swelling', 'Redness', 'Joint Locking', 'Weakness', 'Pain While Extending', 'Bruising', 'Limited Movement'],
  wrist: ['Weak Grip', 'Swelling', 'Wrist Deformity', 'Numbness', 'Pain While Rotating', 'Tingling', 'Bruising', 'Joint Instability'],
  finger: ['Finger Bent Abnormally', 'Bruising', 'Swelling', 'Finger Locking', 'Pain While Gripping', 'Finger Stiffness'],
  chest: ['Difficulty Breathing', 'Tightness', 'Chest Pain', 'Pain While Breathing', 'Bruising', 'Sharp Impact Pain', 'Rib Pain'],
  back: ['Muscle Tightness', 'Shooting Pain', 'Stiffness', 'Posture Imbalance', 'Lower Back Pain', 'Pain While Bending', 'Spasm', 'Numbness'],
  hip: ['Groin Pull', 'Pain While Walking', 'Hip Tightness', 'Instability', 'Swelling', 'Sharp Movement Pain', 'Reduced Mobility'],
  knee: ['Swelling', 'Bruising', 'Knee Giving Way', 'Popping Sound', 'Locking', 'Pain While Walking', 'Cannot Bend Knee', 'Instability', 'Sharp Pain', 'Cannot Stand Properly'],
  ankle: ['Twisted Ankle', 'Swelling', 'Bruising', 'Sharp Pain', 'Instability', 'Cannot Walk', 'Pain While Rotating', 'Redness', 'Warm Sensation'],
  foot: ['Unable To Bear Weight', 'Sharp Pain', 'Swelling', 'Bruising', 'Toe Deformity', 'Foot Instability', 'Heel Pain']
};

export const getSymptomsForPart = (part: BodyPart): string[] => {
  if (part.includes('head') || part === 'forehead' || part === 'eyes' || part === 'nose' || part === 'jaw') return SYMPTOMS_BY_REGION.head;
  if (part.includes('neck')) return SYMPTOMS_BY_REGION.neck;
  if (part.includes('shoulder')) return SYMPTOMS_BY_REGION.shoulder;
  if (part.includes('elbow')) return SYMPTOMS_BY_REGION.elbow;
  if (part.includes('wrist')) return SYMPTOMS_BY_REGION.wrist;
  if (part.includes('finger') || part.includes('hand')) return SYMPTOMS_BY_REGION.finger;
  if (part.includes('chest') || part.includes('ribs') || part.includes('abdomen')) return SYMPTOMS_BY_REGION.chest;
  if (part.includes('back') || part.includes('spine')) return SYMPTOMS_BY_REGION.back;
  if (part.includes('hip') || part.includes('groin') || part.includes('glute')) return SYMPTOMS_BY_REGION.hip;
  if (part.includes('knee')) return SYMPTOMS_BY_REGION.knee;
  if (part.includes('ankle') || part.includes('achilles')) return SYMPTOMS_BY_REGION.ankle;
  if (part.includes('foot') || part.includes('toe') || part.includes('heel')) return SYMPTOMS_BY_REGION.foot;
  
  // default fallback
  return ['Swelling', 'Bruising', 'Sharp Pain', 'Limited Movement'];
};
