import twilio from 'twilio';

// The user must provide these Twilio credentials in their Vercel environment variables.
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Initialize the Twilio client only if credentials are provided
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendWhatsAppAlert(siteName: string, siteId: string) {
  // If Twilio is not configured, silently skip sending
  if (!client) {
    console.log('Twilio credentials not found. Skipping WhatsApp notification.');
    return false;
  }

  // The Twilio WhatsApp sender number (usually provided by Twilio)
  // Format must be 'whatsapp:+1234567890'
  const fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; 
  
  // The employee's receiving WhatsApp number
  const toEmployeeNumber = process.env.EMPLOYEE_PHONE_NUMBER;

  if (!toEmployeeNumber) {
    console.error('EMPLOYEE_PHONE_NUMBER is not set in environment variables.');
    return false;
  }

  // Ensure the employee number is prefixed with 'whatsapp:'
  const toFormatted = toEmployeeNumber.startsWith('whatsapp:') 
    ? toEmployeeNumber 
    : `whatsapp:${toEmployeeNumber}`;

  try {
    const message = await client.messages.create({
      body: `🚨 *URGENT: Solar Site Offline* 🚨\n\nThe monitoring system has detected that a site has gone offline:\n\n*Site Name:* ${siteName}\n*Site ID / SN:* ${siteId}\n*Time:* ${new Date().toLocaleString()}\n\nPlease check the SolaXCloud dashboard for more details.`,
      from: fromWhatsAppNumber,
      to: toFormatted,
    });

    console.log('WhatsApp alert sent successfully:', message.sid);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp alert:', error);
    return false;
  }
}
