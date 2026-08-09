import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import path from 'path';
import fs from 'fs';
import { NotificationPolicy } from '../policies/notification/notification.policy';

export const uploadDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const { projectId } = req.body;
    if (!projectId) {
      res.status(400).json({ message: 'Project ID is required.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded.' });
      return;
    }

    // Verify project exists
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found.' });
      return;
    }

    // Ensure documents upload directory exists
    const uploadDir = path.join(__dirname, '../../public/uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const originalName = req.file.originalname;
    const fileExtension = path.extname(originalName);
    const sanitizedFileName = `doc_${projectId}_${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadDir, sanitizedFileName);

    // Save the file buffer
    fs.writeFileSync(filePath, req.file.buffer);

    const fileUrl = `/uploads/documents/${sanitizedFileName}`;
    const category = req.body.category || 'SUPPORTING';

    // Create database document record
    const document = await prisma.document.create({
      data: {
        name: originalName,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        version: 1,
        category,
        projectId,
      },
    });

    // Create dynamic notification for team members
    const sender = await prisma.user.findUnique({ where: { id: userId } });
    const membersToNotify = project.members.filter((m) => m.userId !== userId);
    
    // Notify others if the owner uploaded, or notify owner/others if a member uploaded
    const notificationPromises = [];
    if (NotificationPolicy.shouldNotifyDocumentUploaded(userId, project.ownerId)) {
      notificationPromises.push(
        prisma.notification.create({
          data: {
            userId: project.ownerId,
            title: 'New Document Uploaded',
            message: `${sender?.fullName || sender?.username} uploaded "${originalName}" to your project.`,
            type: 'GENERAL',
            referenceId: projectId,
          },
        })
      );
    }

    for (const member of membersToNotify) {
      if (NotificationPolicy.shouldNotifyDocumentUploaded(userId, member.userId)) {
        notificationPromises.push(
          prisma.notification.create({
            data: {
              userId: member.userId,
              title: 'New Document Uploaded',
              message: `${sender?.fullName || sender?.username} uploaded "${originalName}" to project "${project.title}".`,
              type: 'GENERAL',
              referenceId: projectId,
            },
          })
        );
      }
    }

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId,
        projectId,
        action: `Uploaded document: "${originalName}" (Version 1).`,
      },
    });

    await Promise.all(notificationPromises);

    res.status(201).json({
      message: 'Document uploaded successfully.',
      document,
    });
  } catch (error: any) {
    console.error('[Document Upload Error]', error);
    res.status(500).json({ message: error.message || 'Failed to upload document.' });
  }
};

export const deleteDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const id = req.params.id as string;
    if (!id) {
      res.status(400).json({ message: 'Document ID is required.' });
      return;
    }

    // Fetch document
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      res.status(404).json({ message: 'Document not found.' });
      return;
    }

    // Delete physically if exists
    const relativePath = document.fileUrl.replace('/uploads/documents/', '');
    const physicalPath = path.join(__dirname, '../../public/uploads/documents', relativePath);

    if (fs.existsSync(physicalPath)) {
      fs.unlinkSync(physicalPath);
    }

    // Delete database entry
    await prisma.document.delete({
      where: { id },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId,
        projectId: document.projectId,
        action: `Deleted document: "${document.name}".`,
      },
    });

    res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (error: any) {
    console.error('[Document Delete Error]', error);
    res.status(500).json({ message: error.message || 'Failed to delete document.' });
  }
};
