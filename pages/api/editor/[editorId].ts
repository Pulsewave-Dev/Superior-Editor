import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory storage for uploaded data (in production, use Redis or similar)
const sessionData = new Map<string, any>();
const sessionChanges = new Map<string, any>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { editorId } = req.query;

  try {
    if (req.method === 'POST' && req.body.data) {
      // Upload data from JSON file
      const data = req.body.data;
      sessionData.set(editorId as string, data);
      res.status(200).json({ success: true, message: 'Data uploaded successfully' });
    } else if (req.method === 'GET') {
      // Get current data for web editor
      const data = sessionData.get(editorId as string);
      
      if (!data) {
        return res.status(404).json({ error: 'Session not found - please upload data file' });
      }

      res.status(200).json({
        ranks: data.ranks || [],
        tags: data.tags || [],
        lastUpdated: data.lastUpdated,
        version: data.version
      });
    } else if (req.method === 'POST') {
      // Submit changes from web editor
      const { rankChanges, tagChanges } = req.body;
      
      const data = sessionData.get(editorId as string);
      if (!data) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Get current version
      const currentChanges = sessionChanges.get(editorId as string) || {};
      const newVersion = (currentChanges.version || 0) + 1;

      // Save changes for download
      const changes = {
        editorId: editorId,
        serverUuid: data.serverUuid,
        rankChanges: rankChanges || [],
        tagChanges: tagChanges || [],
        version: newVersion,
        submittedAt: Date.now()
      };
      
      sessionChanges.set(editorId as string, changes);

      res.status(200).json({ 
        success: true, 
        version: newVersion,
        downloadUrl: `/api/editor/${editorId}/download`
      });
    } else if (req.method === 'DELETE') {
      // Get changes for download
      const changes = sessionChanges.get(editorId as string);
      
      if (!changes) {
        return res.status(404).json({ error: 'No changes found' });
      }

      res.status(200).json(changes);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
