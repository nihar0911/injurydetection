/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  userId: string;
  displayName: string;
  sports: string[];
  pastInjuries: string;
  weight?: number;
  height?: number;
  createdAt: any;
  tier: 'free' | 'pro';
  scansCount: number;
  lastScanReset?: any;
}

export interface Injury {
  id: string;
  userId: string;
  area: string; // "knee", "shoulder", etc.
  symptoms: string[];
  visualSigns: string[];
  triageResult: {
    diagnosis: string;
    probability: number;
    plan: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'emergency';
    severityScore?: number;
    movementDecision?: string;
    confidence?: number;
    extractedFeatures?: string[];
  };
  bp?: string;
  spo2?: number;
  emergencyEscalated: boolean;
  timestamp: any;
}

export interface RecoveryPlan {
  id: string;
  userId: string;
  injuryId: string;
  startDate: any;
  planSteps: {
    day: number;
    action: string;
    details: string;
    completed: boolean;
  }[];
  preventionTips: string[];
  status: 'active' | 'completed';
}

export type BodyPart = 
  | 'head' | 'forehead' | 'eyes' | 'nose' | 'jaw' | 'neck' | 'shoulder_left' | 'shoulder_right'
  | 'upper_arm_left' | 'upper_arm_right' | 'elbow_left' | 'elbow_right' | 'forearm_left' | 'forearm_right'
  | 'wrist_left' | 'wrist_right' | 'hand_left' | 'hand_right' | 'fingers'
  | 'chest' | 'ribs' | 'abdomen' | 'hip' | 'groin' | 'thigh_left' | 'thigh_right'
  | 'knee_left' | 'knee_right' | 'shin_left' | 'shin_right' | 'calf_left' | 'calf_right'
  | 'ankle_left' | 'ankle_right' | 'foot_left' | 'foot_right' | 'toes'
  | 'back_head' | 'upper_back' | 'spine' | 'lower_back' | 'shoulder_blade_left' | 'shoulder_blade_right'
  | 'tricep_left' | 'tricep_right' | 'glute_left' | 'glute_right' | 'hamstring_left' | 'hamstring_right'
  | 'back_knee_left' | 'back_knee_right' | 'achilles_left' | 'achilles_right' | 'heel_left' | 'heel_right';

