import { Response } from 'express';
import { ProjectRequest } from '../policies/middleware/policyGuard';
import { PatentSearchService } from '../services/patentSearchService';
import { PatentReferenceService } from '../services/patentReferenceService';

/**
 * Searches patents using the query string in the request.
 */
export const searchPatents = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;

    if (!query || !query.trim()) {
      res.status(400).json({ message: 'Search query parameter "q" is required.' });
      return;
    }

    const results = await PatentSearchService.search(query);
    res.status(200).json({ success: true, results });
  } catch (error: any) {
    console.error('searchPatents Error:', error);
    const status = error.message?.includes('timed out') || error.message?.includes('rate limit') ? 502 : 400;
    res.status(status).json({ message: error.message || 'Failed to search patents.' });
  }
};

/**
 * Retrieves saved references for a specific project.
 */
export const getSavedReferences = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const references = await PatentReferenceService.listReferences(projectId);
    res.status(200).json({ success: true, references });
  } catch (error: any) {
    console.error('getSavedReferences Error:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve saved references.' });
  }
};

/**
 * Saves a patent reference to a project.
 */
export const saveReference = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const { patentNumber, title, abstract, claims, url, inventors, assignee, publishDate, source } = req.body;

    if (!patentNumber || !title) {
      res.status(400).json({ message: 'Patent number and title are required.' });
      return;
    }

    const saved = await PatentReferenceService.saveReference(projectId, {
      patentNumber,
      title,
      abstract,
      claims,
      url,
      inventors,
      assignee,
      publishDate,
      source
    });

    res.status(201).json({ success: true, reference: saved });
  } catch (error: any) {
    console.error('saveReference Error:', error);
    res.status(400).json({ message: error.message || 'Failed to save patent reference.' });
  }
};

/**
 * Deletes a saved reference from a project.
 */
export const deleteReference = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const referenceId = req.params.refId as string;

    if (!referenceId) {
      res.status(400).json({ message: 'Reference ID is required.' });
      return;
    }

    await PatentReferenceService.deleteReference(projectId, referenceId);
    res.status(200).json({ success: true, message: 'Patent reference deleted successfully.' });
  } catch (error: any) {
    console.error('deleteReference Error:', error);
    res.status(400).json({ message: error.message || 'Failed to delete patent reference.' });
  }
};
