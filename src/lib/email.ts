import { Resend } from 'resend';

// The user must provide a Resend API Key in their Vercel environment variables.
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

export async function sendOfflineAlert(siteName: string, siteId: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'AI Solar Monitor <onboarding@resend.dev>',
      to: ['calvintgb33@gmail.com'],
      subject: `🚨 URGENT: Solar Site Offline (${siteName})`,
      html: `
        <h2>Solar Site Offline Alert</h2>
        <p>The monitoring system has detected that the following site has gone offline:</p>
        <ul>
          <li><strong>Site Name:</strong> ${siteName}</li>
          <li><strong>Site ID / SN:</strong> ${siteId}</li>
          <li><strong>Time Detected:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>Please check the SolaXCloud dashboard for more details.</p>
        <br/>
        <p><small>This is an automated alert from AI Solar OS.</small></p>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return false;
    }

    console.log('Offline alert sent successfully:', data);
    return true;
  } catch (err) {
    console.error('Error sending offline alert:', err);
    return false;
  }
}
