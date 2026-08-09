import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ProjectRole } from '@prisma/client';

export const inviteMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const senderId = req.user?.userId;
    if (!senderId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const { projectId, username, role } = req.body; // role: 'INVENTOR' | 'CO_INVENTOR' | 'GUIDE' | 'PATENT_EXPERT'

    if (!projectId || !username || !role) {
      res.status(400).json({ message: 'Project ID, username, and role are required.' });
      return;
    }

    if (!Object.values(ProjectRole).includes(role as ProjectRole)) {
      res.status(400).json({ message: `Invalid project role: ${role}` });
      return;
    }

    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
    });

    const receiver = await prisma.user.findUnique({
      where: { username },
    });

    if (!project || !receiver) {
      res.status(404).json({ message: 'Project or receiver not found.' });
      return;
    }

    if (receiver.id === senderId) {
      res.status(400).json({ message: 'You cannot invite yourself to a project.' });
      return;
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: receiver.id,
        },
      },
    });
    if (existingMember) {
      res.status(400).json({ message: 'This user is already a member of the project.' });
      return;
    }

    const existingInvite = await prisma.invitation.findFirst({
      where: {
        projectId,
        receiverId: receiver.id,
        status: 'PENDING',
      },
    });
    if (existingInvite) {
      res.status(400).json({ message: 'A pending invitation has already been sent to this user.' });
      return;
    }

    // Fetch sender details
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
    });

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        projectId,
        senderId,
        receiverId: receiver.id,
        role: role as ProjectRole,
        status: 'PENDING',
      },
    });

    // Create Notification for the receiver
    const cleanRoleName = role.toLowerCase().replace('_', ' ');
    await prisma.notification.create({
      data: {
        userId: receiver.id,
        title: 'Project Invitation',
        message: `${sender?.fullName || sender?.username} invited you to join "${project.title}" as a ${cleanRoleName}.`,
        type: 'INVITATION',
        referenceId: invitation.id,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: senderId,
        projectId,
        action: `Sent invitation to ${receiver.fullName} to join as ${cleanRoleName}.`,
      },
    });

    res.status(201).json({
      message: `Invitation successfully sent to @${username}!`,
      invitation,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to send invitation.' });
  }
};

export const respondToInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const receiverId = req.user?.userId;
    if (!receiverId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const { invitationId, status } = req.body; // status: 'ACCEPTED' | 'REJECTED'

    if (!invitationId || !status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      res.status(400).json({ message: 'Invitation ID and response status (ACCEPTED/REJECTED) are required.' });
      return;
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        project: true,
        sender: true,
        receiver: true,
      },
    });

    if (!invitation) {
      res.status(404).json({ message: 'Invitation not found.' });
      return;
    }

    if (invitation.status !== 'PENDING') {
      res.status(400).json({ message: `This invitation has already been ${invitation.status.toLowerCase()}.` });
      return;
    }

    if (invitation.receiverId !== receiverId) {
      res.status(403).json({ message: 'Access denied. This invitation was sent to another user.' });
      return;
    }

    if (!invitation.project) {
      res.status(404).json({ message: 'The associated project no longer exists.' });
      return;
    }

    if (status === 'ACCEPTED') {
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: invitation.projectId,
            userId: receiverId,
          },
        },
      });
      if (existingMember) {
        res.status(400).json({ message: 'You are already a member of this project.' });
        return;
      }
    }

    // Atomically update invitation status and create membership
    await prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitationId },
        data: { status },
      });

      if (status === 'ACCEPTED') {
        await tx.projectMember.create({
          data: {
            projectId: invitation.projectId,
            userId: receiverId,
            role: invitation.role,
          },
        });
      }
    });

    const cleanRoleName = invitation.role.toLowerCase().replace('_', ' ');

    if (status === 'ACCEPTED') {
      // Notify the sender
      await prisma.notification.create({
        data: {
          userId: invitation.senderId,
          title: 'Invitation Accepted',
          message: `${invitation.receiver.fullName} has accepted your invitation to join "${invitation.project.title}" as a ${cleanRoleName}.`,
          type: 'GENERAL',
          referenceId: invitation.projectId,
        },
      });

      // Log project activity
      await prisma.activityLog.create({
        data: {
          userId: receiverId,
          projectId: invitation.projectId,
          action: `${invitation.receiver.fullName} joined the project as a ${cleanRoleName}.`,
        },
      });
    } else {
      // Notify the sender about rejection
      await prisma.notification.create({
        data: {
          userId: invitation.senderId,
          title: 'Invitation Declined',
          message: `${invitation.receiver.fullName} declined your invitation to join "${invitation.project.title}".`,
          type: 'GENERAL',
          referenceId: invitation.projectId,
        },
      });
    }

    res.status(200).json({
      message: `Invitation successfully ${status.toLowerCase()}!`,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to respond to invitation.' });
  }
};

export const listMyInvitations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        project: {
          select: {
            title: true,
            innovationIdea: true,
            technicalDomain: true,
          },
        },
        sender: {
          select: {
            fullName: true,
            username: true,
            institution: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(invitations);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch invitations.' });
  }
};

export const listMyNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch notifications.' });
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const id = req.params.id as string;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      res.status(404).json({ message: 'Notification not found.' });
      return;
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update notification.' });
  }
};