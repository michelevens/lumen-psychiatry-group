/**
 * EnnHealth Credentialing Ops v2 — Email Generator
 *
 * Generates email templates for credentialing workflows:
 * - Initial application inquiry
 * - Status follow-up
 * - Document submission
 * - Escalation
 * - Expansion outreach
 */

import { getPayerById } from '../data/payers.js';
import { getStateName } from '../data/states.js';
import { store } from './store.js';

// ─── Template Registry ───

const TEMPLATES = {
  initial_inquiry: {
    name: 'Initial Credentialing Inquiry',
    subject: 'Provider Credentialing Application — {{orgName}}',
    body: `Dear {{payerName}} Provider Relations,

I am writing to initiate the credentialing process for our practice with {{payerName}}.

Provider Information:
• Practice: {{orgName}}
• Provider: {{providerName}}, {{credentials}}
• NPI (Individual): {{providerNpi}}
• NPI (Group): {{orgNpi}}
• Taxonomy: {{taxonomy}}
• Specialty: Psychiatric Mental Health
• State(s): {{states}}
• Service Type: Telehealth (all services delivered via secure video)

We are seeking to credential as {{applicationType}} and would like to begin accepting {{payerName}} patients in {{states}}.

Please provide:
1. The credentialing application or portal link
2. Required documentation checklist
3. Estimated processing timeline
4. Contact information for our assigned credentialing specialist

Our practice information:
{{orgName}}
{{orgAddress}}
Phone: {{orgPhone}}
Email: {{orgEmail}}

Thank you for your time. We look forward to joining the {{payerName}} provider network.

Best regards,
{{providerName}}, {{credentials}}
{{orgName}}`,
  },

  status_followup: {
    name: 'Status Follow-up',
    subject: 'Credentialing Status Follow-up — {{providerName}} / {{applicationRef}}',
    body: `Dear {{payerName}} Provider Relations,

I am following up on our credentialing application submitted on {{submittedDate}}.

Application Details:
• Provider: {{providerName}}, {{credentials}}
• NPI: {{providerNpi}}
• Application/Reference #: {{applicationRef}}
• State: {{states}}
• Application Type: {{applicationType}}
• Date Submitted: {{submittedDate}}

This is follow-up #{{followupNumber}}. Our last contact was on {{lastContactDate}}.

Could you please provide an update on the status of our application? If any additional documentation is needed, please let us know and we will provide it promptly.

Thank you,
{{providerName}}, {{credentials}}
{{orgName}}
{{orgPhone}}`,
  },

  document_submission: {
    name: 'Document Submission',
    subject: 'Requested Documents — {{providerName}} Credentialing / {{applicationRef}}',
    body: `Dear {{payerName}} Provider Relations,

Per your request, please find the following documents attached for our credentialing application:

Application Reference: {{applicationRef}}
Provider: {{providerName}}, {{credentials}}
NPI: {{providerNpi}}

Documents Enclosed:
{{documentList}}

Please confirm receipt of these documents and advise if anything additional is needed.

Thank you,
{{providerName}}, {{credentials}}
{{orgName}}
{{orgPhone}}`,
  },

  escalation: {
    name: 'Escalation Request',
    subject: 'ESCALATION: Credentialing Application Delayed — {{providerName}} / {{applicationRef}}',
    body: `Dear {{payerName}} Provider Relations Supervisor,

I am writing to escalate our credentialing application, which has been pending for {{ageDays}} days without resolution.

Application Details:
• Provider: {{providerName}}, {{credentials}}
• NPI: {{providerNpi}}
• Application/Reference #: {{applicationRef}}
• State: {{states}}
• Date Submitted: {{submittedDate}}
• Days Pending: {{ageDays}}
• Follow-ups Made: {{followupCount}}

We have made {{followupCount}} follow-up attempts and have not received a definitive update on the status of our application. We are eager to begin serving {{payerName}} members and respectfully request expedited review.

Please advise on:
1. Current status of the application
2. Any outstanding items preventing approval
3. Expected timeline for completion

Thank you for your attention to this matter.

{{providerName}}, {{credentials}}
{{orgName}}
{{orgPhone}}
{{orgEmail}}`,
  },

  expansion_outreach: {
    name: 'Multi-State Expansion Outreach',
    subject: 'Provider Network Participation — {{orgName}} (Multi-State Telehealth)',
    body: `Dear {{payerName}} Provider Relations,

{{orgName}} is a telehealth psychiatric practice currently licensed in {{totalStates}} states. We are interested in joining the {{payerName}} provider network to serve your members.

About Our Practice:
• Specialty: Psychiatric Mental Health (adults & adolescents)
• Provider: {{providerName}}, {{credentials}}
• Service Model: 100% Telehealth via secure HIPAA-compliant video
• Licensed States: {{stateList}}
• Currently credentialed with: {{existingPayers}}

Services Offered:
• Psychiatric evaluations
• Medication management
• ADHD assessment & treatment
• Anxiety & depression treatment
• PTSD & trauma-informed care
• Insomnia & sleep disorders
• Genetic testing for medication optimization

We would like to initiate the credentialing process for the following states:
{{targetStates}}

Please provide the application portal or documentation requirements. We are ready to submit all necessary materials promptly.

Best regards,
{{providerName}}, {{credentials}}
{{orgName}}
{{orgAddress}}
Phone: {{orgPhone}}
Email: {{orgEmail}}
Website: ennhealth.com`,
  },
};

// ─── Generate Email from Template ───

export function generateEmail(templateId, context = {}) {
  const template = TEMPLATES[templateId];
  if (!template) {
    return { success: false, error: `Unknown template: ${templateId}` };
  }

  const vars = buildTemplateVars(context);
  const subject = replaceVars(template.subject, vars);
  const body = replaceVars(template.body, vars);

  return {
    success: true,
    templateName: template.name,
    subject,
    body,
    to: context.recipientEmail || '',
  };
}

// ─── Generate Email for Application ───

export function generateEmailForApplication(appId, templateId) {
  const app = store.getById('applications', appId);
  if (!app) return { success: false, error: 'Application not found' };

  const provider = store.getById('providers', app.providerId);
  const org = store.getById('organizations', app.orgId);
  const payer = getPayerById(app.payerId);
  const followups = store.query('followups', { applicationId: appId })
    .filter(f => f.completedDate)
    .sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''));

  const age = app.submittedDate
    ? Math.floor((new Date() - new Date(app.submittedDate)) / 86400000)
    : 0;

  return generateEmail(templateId, {
    application: app,
    provider,
    organization: org,
    payer,
    followups,
    ageDays: age,
  });
}

// ─── Generate Batch Emails for Expansion ───

export function generateExpansionEmails(targetStates, payerIds = []) {
  const orgs = store.getAll('organizations');
  const providers = store.getAll('providers').filter(p => p.active);
  const org = orgs[0];
  const provider = providers[0];

  if (!org || !provider) {
    return { success: false, error: 'No organization or active provider configured' };
  }

  const approvedApps = store.query('applications', { status: 'approved' });
  const existingPayers = [...new Set(approvedApps.map(a => a.payerName || a.payerId))].join(', ');
  const licenses = store.getAll('licenses').filter(l => l.status === 'active');
  const licensedStates = licenses.map(l => l.state);

  const emails = [];

  // Get unique payers to contact
  const payers = payerIds.length > 0
    ? payerIds.map(id => getPayerById(id)).filter(Boolean)
    : [];

  if (payers.length === 0) {
    // Generate one generic expansion email
    emails.push(generateEmail('expansion_outreach', {
      organization: org,
      provider,
      existingPayers,
      licensedStates,
      targetStates,
    }));
  } else {
    for (const payer of payers) {
      const payerTargetStates = targetStates.filter(s =>
        payer.states && (payer.states.includes(s) || payer.states.includes('ALL'))
      );
      if (payerTargetStates.length === 0) continue;

      emails.push(generateEmail('expansion_outreach', {
        payer,
        organization: org,
        provider,
        existingPayers,
        licensedStates,
        targetStates: payerTargetStates,
      }));
    }
  }

  return { success: true, emails, count: emails.length };
}

// ─── Template Variable Resolution ───

function buildTemplateVars(context) {
  const {
    application = {},
    provider = {},
    organization = {},
    payer = {},
    followups = [],
    ageDays = 0,
    existingPayers = '',
    licensedStates = [],
    targetStates = [],
  } = context;

  return {
    orgName: organization.name || 'EnnHealth Psychiatry',
    orgNpi: organization.npi || '[GROUP NPI]',
    orgAddress: formatAddress(organization.address),
    orgPhone: organization.phone || '(407) 796-2406',
    orgEmail: organization.email || 'contact@ennhealth.com',
    providerName: provider.firstName && provider.lastName
      ? `${provider.firstName} ${provider.lastName}`
      : '[PROVIDER NAME]',
    credentials: provider.credentials || '[CREDENTIALS]',
    providerNpi: provider.npi || '[INDIVIDUAL NPI]',
    taxonomy: provider.taxonomy || '[TAXONOMY]',
    payerName: payer.name || application.payerName || '[PAYER NAME]',
    states: application.state ? getStateName(application.state) : targetStates.map(s => getStateName(s)).join(', '),
    applicationType: application.type === 'group' ? 'Group Practice' : application.type === 'both' ? 'Individual + Group' : 'Individual Provider',
    applicationRef: application.applicationRef || application.enrollmentId || '[APPLICATION REF]',
    submittedDate: application.submittedDate || '[SUBMITTED DATE]',
    ageDays: String(ageDays),
    followupCount: String(followups.length),
    followupNumber: String(followups.length + 1),
    lastContactDate: followups.length > 0 ? followups[0].completedDate : '[LAST CONTACT DATE]',
    documentList: '• [List documents here]',
    existingPayers: existingPayers || '[LIST EXISTING PAYERS]',
    totalStates: String(licensedStates.length || '[NUMBER]'),
    stateList: licensedStates.length > 0 ? licensedStates.join(', ') : '[LICENSED STATES]',
    targetStates: (Array.isArray(targetStates) ? targetStates : []).map(s => getStateName(s)).join(', ') || '[TARGET STATES]',
  };
}

function replaceVars(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

function formatAddress(addr) {
  if (!addr) return '[ADDRESS]';
  return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zip || ''}`.trim();
}

// ─── Get Available Templates ───

export function getTemplateList() {
  return Object.entries(TEMPLATES).map(([id, t]) => ({
    id,
    name: t.name,
    subject: t.subject,
  }));
}
