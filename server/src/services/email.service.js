import transporter from '../config/email.js';

const BASE_STYLES = `
  body { margin: 0; padding: 0; font-family: 'DM Sans', Arial, sans-serif; background: #f7f6f3; }
  .container { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: #0f1729; padding: 32px 40px; text-align: center; }
  .header h1 { color: #ffffff; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -0.5px; }
  .header h1 span { color: #ff6b35; }
  .body { padding: 40px; }
  .body h2 { color: #0f1729; font-size: 22px; margin-top: 0; font-weight: 700; }
  .body p { color: #4b5563; font-size: 15px; line-height: 1.6; }
  .btn { display: inline-block; background: #ff6b35; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; margin: 24px 0; }
  .status-chip { display: inline-block; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; margin: 4px 2px; }
  .footer { background: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { color: #9ca3af; font-size: 13px; margin: 0; }
`;

function baseTemplate(content) {
  return `<!DOCTYPE html><html><head><style>${BASE_STYLES}</style></head><body>
    <div class="container">
      <div class="header"><h1>Civic<span>Fix</span></h1></div>
      <div class="body">${content}</div>
      <div class="footer"><p>CivicFix · Making Indian cities better, one report at a time</p></div>
    </div>
  </body></html>`;
}

export async function sendWelcomeEmail(user) {
  if (!process.env.SMTP_USER) return;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'CivicFix <noreply@civicfix.in>',
    to: user.email,
    subject: 'Welcome to CivicFix!',
    html: baseTemplate(`
      <h2>Welcome, ${user.name.split(' ')[0]}! 🎉</h2>
      <p>You've joined <strong>CivicFix</strong> — India's civic issue reporting platform. Your voice matters in making our cities better.</p>
      <p>You can now:</p>
      <ul style="color:#4b5563; line-height:2">
        <li>Report civic issues in your area</li>
        <li>Track the resolution progress</li>
        <li>Upvote issues that matter to you</li>
        <li>Get notified when issues are resolved</li>
      </ul>
      <a href="${process.env.CLIENT_URL}/feed" class="btn">Start Reporting Issues →</a>
    `),
  });
}

export async function sendPasswordResetEmail(user, token) {
  if (!process.env.SMTP_USER) return;
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'CivicFix <noreply@civicfix.in>',
    to: user.email,
    subject: 'Reset your CivicFix password',
    html: baseTemplate(`
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name.split(' ')[0]}, we received a request to reset your password.</p>
      <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <a href="${resetUrl}" class="btn">Reset Password →</a>
      <p style="font-size:13px; color:#9ca3af; margin-top:24px;">If you didn't request this, please ignore this email.</p>
    `),
  });
}

export async function sendStatusUpdateEmail(user, issue, newStatus, note) {
  if (!process.env.SMTP_USER) return;
  const statusColors = {
    IN_PROGRESS: { bg: '#dbeafe', color: '#1d4ed8', label: 'In Progress' },
    RESOLVED: { bg: '#dcfce7', color: '#15803d', label: 'Resolved' },
    REJECTED: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
    IN_REVIEW: { bg: '#fef3c7', color: '#d97706', label: 'Under Review' },
    REOPENED: { bg: '#f3e8ff', color: '#7c3aed', label: 'Reopened' },
  };
  const statusInfo = statusColors[newStatus] || { bg: '#f1f5f9', color: '#475569', label: newStatus };
  const issueUrl = `${process.env.CLIENT_URL}/issue/${issue.id}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'CivicFix <noreply@civicfix.in>',
    to: user.email,
    subject: `Issue Update: "${issue.title}"`,
    html: baseTemplate(`
      <h2>Status Update on Your Issue</h2>
      <p>Hi ${user.name.split(' ')[0]}, your reported issue has been updated:</p>
      <div style="background:#f9fafb; border-radius:12px; padding:20px; margin:20px 0;">
        <p style="font-weight:700; color:#0f1729; margin:0 0 8px">${issue.title}</p>
        <span class="status-chip" style="background:${statusInfo.bg}; color:${statusInfo.color};">● ${statusInfo.label}</span>
        ${note ? `<p style="margin:12px 0 0; color:#6b7280; font-size:14px;">${note}</p>` : ''}
      </div>
      <a href="${issueUrl}" class="btn">Track Issue →</a>
    `),
  });
}

export async function sendOfficialUpdateEmail(user, issue, officialName, message) {
  if (!process.env.SMTP_USER) return;
  const issueUrl = `${process.env.CLIENT_URL}/issue/${issue.id}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'CivicFix <noreply@civicfix.in>',
    to: user.email,
    subject: `Official Update on: "${issue.title}"`,
    html: baseTemplate(`
      <h2>Official Update on Your Issue</h2>
      <p>Hi ${user.name.split(' ')[0]}, a municipal official has posted an update:</p>
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px; margin:20px 0;">
        <p style="font-weight:700; color:#15803d; margin:0 0 4px; font-size:13px;">FROM ${officialName.toUpperCase()}</p>
        <p style="color:#374151; margin:0;">${message}</p>
      </div>
      <a href="${issueUrl}" class="btn">View Full Update →</a>
    `),
  });
}
