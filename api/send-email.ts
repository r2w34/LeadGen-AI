import sgMail from '@sendgrid/mail';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, content, leadName } = req.body;

    if (!to || !subject || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    sgMail.setApiKey(apiKey);

    const msg = {
      to,
      from: fromEmail,
      subject,
      text: content,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .email-content {
              white-space: pre-wrap;
              background: #f9f9f9;
              padding: 20px;
              border-radius: 5px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="email-content">
            ${content.split('\n').join('<br>')}
          </div>
          <div class="footer">
            <p>This email was sent via LeadGen-AI</p>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);

    return res.status(200).json({ 
      success: true,
      message: `Email sent successfully to ${leadName || to}`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Email sending error:', error);
    
    // SendGrid specific error handling
    if (error.response) {
      console.error('SendGrid error:', error.response.body);
      return res.status(error.code || 500).json({ 
        error: 'Failed to send email',
        details: error.response.body.errors || error.message
      });
    }

    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}
