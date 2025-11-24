
import { OutreachSequence, SMTPConfig, Lead, Activity } from '../types';

export const verifySMTP = async (config: SMTPConfig): Promise<boolean> => {
  // Simulate SMTP verification delay
  return new Promise(resolve => {
    setTimeout(() => {
      // Simple validation for demo
      const isValid = config.host.length > 3 && config.user.includes('@');
      resolve(isValid);
    }, 1500);
  });
};

export const sendEmail = async (config: SMTPConfig, to: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (Math.random() > 0.1) {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: 'SMTP Connection Timeout' });
      }
    }, 800);
  });
};

export const triggerSequence = (lead: Lead, sequence: OutreachSequence): Lead => {
  const newActivity: Activity = {
    id: `act-seq-${Date.now()}`,
    type: 'sequence_start',
    description: `Enrolled in sequence: ${sequence.name}`,
    timestamp: new Date().toISOString(),
    user: 'System'
  };
  
  return {
    ...lead,
    activeSequenceId: sequence.id,
    sequenceStatus: 'Active',
    nextScheduledStep: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Next day
    activityTimeline: [newActivity, ...lead.activityTimeline]
  };
};

export const pauseSequence = (lead: Lead): Lead => {
  const newActivity: Activity = {
    id: `act-pause-${Date.now()}`,
    type: 'sequence_pause',
    description: `Automation paused manually.`,
    timestamp: new Date().toISOString(),
    user: 'User'
  };

  return {
    ...lead,
    sequenceStatus: 'Paused',
    nextScheduledStep: undefined,
    activityTimeline: [newActivity, ...lead.activityTimeline]
  };
};
