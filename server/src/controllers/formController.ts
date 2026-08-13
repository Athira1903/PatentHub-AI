import { Response } from 'express';
import { ProjectRequest } from '../policies/middleware/policyGuard';
import { FormService } from '../services/formService';
import { PdfService } from '../services/pdfService';

export const getProjectForms = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const forms = await FormService.getProjectForms(projectId);
    res.status(200).json({ success: true, forms });
  } catch (error: any) {
    console.error('getProjectForms Error:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve project forms.' });
  }
};

export const getFormById = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const formId = req.params.formId as string;
    const form = await FormService.getFormById(projectId, formId);
    res.status(200).json({ success: true, form });
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Form not found.' });
  }
};

export const saveForm = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const { formType, formData } = req.body;

    if (!formType) {
      res.status(400).json({ message: 'Form type is required.' });
      return;
    }

    const saved = await FormService.saveForm(projectId, formType, formData, req.user?.userId);
    res.status(200).json({ success: true, form: saved });
  } catch (error: any) {
    console.error('saveForm Error:', error);
    res.status(400).json({ message: error.message || 'Failed to save form data.' });
  }
};

export const submitForm = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const formId = req.params.formId as string;

    const submitted = await FormService.submitForm(projectId, formId, req.user!.userId);
    res.status(200).json({ success: true, message: 'Form submitted successfully.', form: submitted });
  } catch (error: any) {
    console.error('submitForm Error:', error);
    res.status(400).json({ message: error.message || 'Failed to submit form.' });
  }
};

export const generateFormPdf = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const formType = (req.params.formType || req.body.formType || 'Form 1') as string;

    const document = await PdfService.generateFormPdf(projectId, formType, req.user?.userId);
    res.status(201).json({ success: true, message: 'PDF generated successfully.', document });
  } catch (error: any) {
    console.error('generateFormPdf Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate form PDF.' });
  }
};
