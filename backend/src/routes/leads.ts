import express, { Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { leadValidation, generateLeadsValidation, uuidValidation } from '../middleware/validation';
import { generateLeads as generateLeadsWithAI } from '../services/gemini';

const router = express.Router();

// Get all leads
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, stage, limit = 50, offset = 0 } = req.query;
    
    let queryText = 'SELECT * FROM leads WHERE user_id = $1';
    const params: any[] = [req.user!.id];
    
    if (status) {
      params.push(status);
      queryText += ` AND status = $${params.length}`;
    }
    
    if (stage) {
      params.push(stage);
      queryText += ` AND stage = $${params.length}`;
    }
    
    queryText += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await query(queryText, params);
    
    res.json({ success: true, leads: result.rows, total: result.rowCount });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Generate AI leads
router.post('/generate', authenticateToken, generateLeadsValidation, async (req: AuthRequest, res: Response) => {
  try {
    const { industry, location, companySize } = req.body;
    
    // Generate leads using AI
    const generatedLeads = await generateLeadsWithAI({ industry, location, companySize });
    
    // Insert leads into database
    const insertPromises = generatedLeads.map((lead: any) =>
      query(
        `INSERT INTO leads (user_id, company_name, website, industry, company_size, 
         location, contact_name, contact_title, email, phone, linkedin_url, fit_score, status, stage)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          req.user!.id,
          lead.companyName,
          lead.website,
          lead.industry,
          lead.companySize,
          lead.location,
          lead.contactName,
          lead.contactTitle,
          lead.email,
          lead.phone,
          lead.linkedinUrl,
          lead.fitScore,
          'new',
          'leads'
        ]
      )
    );
    
    const results = await Promise.all(insertPromises);
    const savedLeads = results.map(r => r.rows[0]);
    
    // Update user stats
    await query(
      'UPDATE user_stats SET total_leads = total_leads + $1, last_lead_generated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [savedLeads.length, req.user!.id]
    );
    
    res.json({ success: true, leads: savedLeads });
  } catch (error) {
    console.error('Generate leads error:', error);
    res.status(500).json({ error: 'Failed to generate leads' });
  }
});

// Create lead manually
router.post('/', authenticateToken, leadValidation, async (req: AuthRequest, res: Response) => {
  try {
    const { companyName, website, industry, companySize, location, contactName, 
            contactTitle, email, phone, linkedinUrl, fitScore, status, stage, notes, tags } = req.body;
    
    const result = await query(
      `INSERT INTO leads (user_id, company_name, website, industry, company_size,
       location, contact_name, contact_title, email, phone, linkedin_url, fit_score, 
       status, stage, notes, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [req.user!.id, companyName, website, industry, companySize, location, contactName,
       contactTitle, email, phone, linkedinUrl, fitScore, status || 'new', stage || 'leads',
       notes, tags]
    );
    
    await query(
      'UPDATE user_stats SET total_leads = total_leads + 1 WHERE user_id = $1',
      [req.user!.id]
    );
    
    res.status(201).json({ success: true, lead: result.rows[0] });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Get lead by ID
router.get('/:id', authenticateToken, uuidValidation, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM leads WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json({ success: true, lead: result.rows[0] });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Failed to get lead' });
  }
});

// Update lead
router.put('/:id', authenticateToken, uuidValidation, async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    const allowedFields = ['company_name', 'website', 'industry', 'company_size', 'location',
                          'contact_name', 'contact_title', 'email', 'phone', 'linkedin_url',
                          'fit_score', 'status', 'stage', 'notes', 'tags', 'last_contacted_at'];
    
    const setClause = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }
    
    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(req.params.id, req.user!.id);
    
    const result = await query(
      `UPDATE leads SET ${setClause.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json({ success: true, lead: result.rows[0] });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Delete lead
router.delete('/:id', authenticateToken, uuidValidation, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'DELETE FROM leads WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    await query(
      'UPDATE user_stats SET total_leads = GREATEST(total_leads - 1, 0) WHERE user_id = $1',
      [req.user!.id]
    );
    
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;
