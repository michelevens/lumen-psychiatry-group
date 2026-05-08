/**
 * EnnHealth Credentialing Ops v2 — Workflow Engine
 *
 * Manages application status transitions, follow-up scheduling,
 * and business rule enforcement.
 */

import { VALID_TRANSITIONS, APPLICATION_STATUSES } from '../data/schema.js';
import { FOLLOWUP_RULES } from '../data/strategies.js';
import { store } from './store.js';

// ─── Status Transitions ───

export function canTransition(fromStatus, toStatus) {
  const allowed = VALID_TRANSITIONS[fromStatus];
  return allowed ? allowed.includes(toStatus) : false;
}

export function getAvailableTransitions(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}

export function transitionApplication(appId, newStatus, notes = '') {
  const app = store.getById('applications', appId);
  if (!app) return { success: false, error: 'Application not found' };

  if (!canTransition(app.status, newStatus)) {
    return {
      success: false,
      error: `Cannot transition from "${app.status}" to "${newStatus}". Allowed: ${getAvailableTransitions(app.status).join(', ')}`,
    };
  }

  const updates = { status: newStatus };
  const now = new Date().toISOString().split('T')[0];

  // Auto-fill dates based on transition
  if (newStatus === 'submitted' && !app.submittedDate) {
    updates.submittedDate = now;
  }
  if (newStatus === 'approved' && !app.effectiveDate) {
    updates.effectiveDate = now;
  }

  // Append status change to notes
  if (notes) {
    updates.notes = (app.notes ? app.notes + '\n' : '') + `[${now}] → ${newStatus}: ${notes}`;
  }

  const result = store.update('applications', appId, updates);

  // Auto-schedule follow-up if rules say so
  if (result.success && FOLLOWUP_RULES.autoSchedule) {
    autoScheduleFollowup(appId, newStatus);
  }

  return result;
}

// ─── Follow-up Scheduling ───

export function autoScheduleFollowup(appId, status) {
  const schedule = FOLLOWUP_RULES.scheduleByStatus[status];
  if (!schedule) return null;

  // Check existing open follow-ups
  const existing = store.query('followups', { applicationId: appId })
    .filter(f => !f.completedDate);

  if (existing.length >= schedule.maxFollowups) return null;

  const dueDate = addDays(new Date(), schedule.intervalDays);

  return store.add('followups', 'followup', {
    applicationId: appId,
    type: 'status_check',
    dueDate: formatDate(dueDate),
    method: 'phone',
    createdAt: new Date().toISOString(),
  });
}

export function completeFollowup(followupId, outcome, nextAction = '') {
  const now = new Date().toISOString().split('T')[0];

  const result = store.update('followups', followupId, {
    completedDate: now,
    outcome,
    nextAction,
  });

  if (!result.success) return result;

  // Auto-schedule next follow-up if there's a next action
  const fu = result.record;
  if (nextAction && fu.applicationId) {
    const app = store.getById('applications', fu.applicationId);
    if (app && !['approved', 'denied', 'withdrawn'].includes(app.status)) {
      autoScheduleFollowup(fu.applicationId, app.status);
    }
  }

  return result;
}

export function getOverdueFollowups() {
  const today = new Date().toISOString().split('T')[0];
  return store.getAll('followups')
    .filter(f => !f.completedDate && f.dueDate && f.dueDate <= today);
}

export function getUpcomingFollowups(days = 7) {
  const today = new Date();
  const future = addDays(today, days);
  const todayStr = formatDate(today);
  const futureStr = formatDate(future);

  return store.getAll('followups')
    .filter(f => !f.completedDate && f.dueDate && f.dueDate > todayStr && f.dueDate <= futureStr);
}

export function getFollowupsForApplication(appId) {
  return store.query('followups', { applicationId: appId })
    .sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
}

// ─── Application Aging ───

export function getApplicationAge(app) {
  if (!app.submittedDate) return null;
  const submitted = new Date(app.submittedDate);
  const now = new Date();
  return Math.floor((now - submitted) / 86400000);
}

export function getAgedApplications(minDays = 90) {
  return store.getAll('applications')
    .filter(a => ['submitted', 'in_review', 'pending_info'].includes(a.status))
    .filter(a => {
      const age = getApplicationAge(a);
      return age !== null && age >= minDays;
    })
    .sort((a, b) => (a.submittedDate || '').localeCompare(b.submittedDate || ''));
}

// ─── Escalation Detection ───

export function getEscalationCandidates() {
  const apps = store.getAll('applications')
    .filter(a => ['submitted', 'in_review', 'pending_info'].includes(a.status));

  const candidates = [];

  for (const app of apps) {
    const followups = getFollowupsForApplication(app.id);
    const completedFollowups = followups.filter(f => f.completedDate);
    const age = getApplicationAge(app);

    const shouldEscalate =
      (age && age >= FOLLOWUP_RULES.escalation.daysWithoutResponse) ||
      (completedFollowups.length >= FOLLOWUP_RULES.escalation.maxFollowupsBeforeEscalation);

    if (shouldEscalate) {
      candidates.push({
        application: app,
        ageDays: age,
        followupCount: completedFollowups.length,
        reason: age >= FOLLOWUP_RULES.escalation.daysWithoutResponse
          ? `${age} days since submission`
          : `${completedFollowups.length} follow-ups without resolution`,
      });
    }
  }

  return candidates;
}

// ─── Helpers ───

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}
