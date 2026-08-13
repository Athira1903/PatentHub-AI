import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/db';
import { FormService } from './formService';

export class PdfService {
  /**
   * Helper to ensure the destination uploads directory exists.
   */
  private static ensureUploadDirectory(): string {
    const uploadDir = path.join(__dirname, '../../public/uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  /**
   * Generates a server-side PDF for an IPO Form (Form 1, 2, 3, 5, 26) using stored form data.
   */
  static async generateFormPdf(projectId: string, formType: string, userId?: string): Promise<any> {
    const normalizedType = FormService.normalizeFormType(formType);
    const formNumber = normalizedType.replace('Form ', '');

    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { fullName: true, email: true, institution: true } },
        members: { include: { user: { select: { fullName: true, username: true, email: true } } } }
      }
    });

    if (!project) {
      throw new Error('Project not found for PDF generation.');
    }

    const patentForm = await prisma.patentForm.findUnique({
      where: {
        projectId_formType: {
          projectId,
          formType: normalizedType
        }
      }
    });

    const formData = (patentForm?.formData as Record<string, any>) || FormService.generateDefaultFormData(project, normalizedType);

    const doc = new jsPDF();

    // Top Header Banner
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`IPO Patent Form ${formNumber}`, 15, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Intellectual Property India (Government of India / Patent Office Registry)', 15, 25);

    // Section Header
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`FORM ${formNumber} [FILING PREPARATION DRAFT]`, 15, 50);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 55, 195, 55);

    let yPos = 65;
    const writeLine = (label: string, text: string, isHeader = false) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
      doc.setFontSize(isHeader ? 10 : 9);

      if (label) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 15, yPos);
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(String(text || 'N/A'), 135);
        doc.text(splitText, 60, yPos);
        yPos += (splitText.length * 5) + 3;
      } else {
        const splitText = doc.splitTextToSize(String(text || ''), 180);
        doc.text(splitText, 15, yPos);
        yPos += (splitText.length * 5) + 3;
      }
    };

    if (normalizedType === 'Form 1') {
      writeLine('', 'APPLICATION FOR GRANT OF PATENT (Section 7, 54 & 135; Rule 5(1))', true);
      yPos += 5;
      writeLine('Applicant Type', formData.applicantType || 'Natural Person');
      writeLine('Applicant Name', formData.applicantName || project.owner.fullName);
      writeLine('Nationality', formData.nationality || 'Indian');
      writeLine('Address (Institution)', formData.address || project.owner.institution || 'N/A');
      writeLine('Email', formData.email || project.owner.email);
      writeLine('Title of Invention', formData.title || project.title);
      writeLine('Category', project.category);
      yPos += 5;
      writeLine('', 'INVENTOR(S) DETAILS:', true);
      writeLine('1. First Inventor', `${project.owner.fullName} (${project.owner.email})`);
      project.members.forEach((m, idx) => {
        writeLine(`${idx + 2}. Co-Inventor`, `${m.user.fullName} (${m.user.email}) - [${m.role}]`);
      });
    } else if (normalizedType === 'Form 2') {
      writeLine('', 'PROVISIONAL / COMPLETE SPECIFICATION (Section 10; Rule 13)', true);
      yPos += 5;
      writeLine('1. Title of Invention', formData.title || project.title);
      writeLine('2. Specification Type', formData.specificationType || 'COMPLETE');
      writeLine('3. Preamble to Description', formData.preamble || 'The following specification particularly describes the invention and the manner in which it is to be performed.');
      yPos += 5;
      writeLine('', '4. DESCRIPTION & CLAIMS:', true);
      writeLine('Abstract Description', formData.abstract || project.innovationIdea);
      writeLine('Problem Statement', formData.problemStatement || project.problemStatement);
      writeLine('Proposed Solution', formData.proposedSolution || project.proposedSolution);
      writeLine('Novel Features', formData.novelFeatures || project.novelFeatures || 'N/A');
      writeLine('Claims Count', String(formData.claimsCount || 1));
      writeLine('Claims Scope', formData.claimsText || `1. A system for ${project.title}, comprising: ${project.proposedSolution}`);
    } else if (normalizedType === 'Form 3') {
      writeLine('', 'STATEMENT AND UNDERTAKING UNDER SECTION 8 (Rule 12)', true);
      yPos += 5;
      writeLine('Applicant Name', formData.applicantName || project.owner.fullName);
      writeLine('Title of Invention', formData.title || project.title);
      writeLine('Undertaking Details', formData.undertakingText || 'I/We hereby declare that we have not made any application for a patent for the same or substantially the same invention outside India except those declared herein.');
    } else if (normalizedType === 'Form 5') {
      writeLine('', 'DECLARATION AS TO INVENTORSHIP (Section 10(6); Rule 4.17(i))', true);
      yPos += 5;
      writeLine('Applicant Name', formData.applicantName || project.owner.fullName);
      writeLine('Title of Invention', formData.title || project.title);
      writeLine('Declaration Text', formData.declarationText || `I/We, the true and first inventors for the patent project titled "${project.title}", hereby confirm our inventorship credentials under IPO rules.`);
    } else if (normalizedType === 'Form 26') {
      writeLine('', 'FORM FOR AUTHORISATION OF A PATENT AGENT / ATTORNEY (Section 140; Rule 135)', true);
      yPos += 5;
      writeLine('Principal Authoriser', formData.authoriserName || project.owner.fullName);
      writeLine('Designated Patent Agent', formData.agentName || 'Registered Patent Agent');
      writeLine('Agent Reg. Number', formData.agentRegistrationNumber || 'IN/PA-XXXX');
      writeLine('Scope of Authorization', formData.authorizationScope || `To act, represent, file and prosecute the patent specification titled "${project.title}" on behalf of the applicant.`);
    }

    // Disclaimer footer
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Note: This is a pre-filing preparation draft compiled by PatentHub AI. Not an official filing receipt.', 15, 285);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const uploadDir = this.ensureUploadDirectory();
    const sanitizedFileName = `Form_${formNumber}_${projectId.substring(0, 8)}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, sanitizedFileName);

    fs.writeFileSync(filePath, pdfBuffer);

    const fileUrl = `/uploads/documents/${sanitizedFileName}`;
    const docName = `IPO Form ${formNumber} (${project.title})`;

    // Register or update Document record in Prisma
    const existingFormDoc = patentForm?.documentId ? await prisma.document.findUnique({ where: { id: patentForm.documentId } }) : null;
    const nextVersion = existingFormDoc ? existingFormDoc.version + 1 : 1;

    const document = await prisma.document.create({
      data: {
        name: docName,
        fileUrl,
        fileType: 'application/pdf',
        fileSize: pdfBuffer.length,
        version: nextVersion,
        category: 'PATENT_DRAFT',
        projectId,
        parentDocId: existingFormDoc?.id || null
      }
    });

    // Link document back to PatentForm
    if (patentForm) {
      await prisma.patentForm.update({
        where: { id: patentForm.id },
        data: { documentId: document.id }
      });
    }

    if (userId) {
      await prisma.activityLog.create({
        data: {
          userId,
          projectId,
          action: `Generated server-side PDF for IPO Form ${formNumber} (Version ${nextVersion}).`
        }
      });
    }

    return document;
  }

  /**
   * Generates a server-side Filing Readiness Audit PDF report.
   */
  static async generateReadinessReportPdf(projectId: string, readinessData: any, userId?: string): Promise<any> {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: { owner: { select: { fullName: true, email: true, institution: true } } }
    });

    if (!project) {
      throw new Error('Project not found for readiness report generation.');
    }

    const doc = new jsPDF();

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('PatentHub AI', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Filing Readiness & Compliance Audit Report', 15, 30);

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Filing Readiness Audit Report', 15, 55);

    doc.setDrawColor(226, 232, 240);
    doc.line(15, 60, 195, 60);

    let yPos = 70;
    const writeField = (label: string, value: string) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${label}:`, 15, yPos);
      doc.setFont('helvetica', 'normal');
      const splitVal = doc.splitTextToSize(value || 'N/A', 135);
      doc.text(splitVal, 60, yPos);
      yPos += (splitVal.length * 5) + 4;
    };

    writeField('Project Title', project.title);
    writeField('Filing Stage', project.stage);
    writeField('Owner / Inventor', project.owner.fullName);
    writeField('Readiness Status', readinessData.overallReadiness || 'NOT_READY');
    writeField('Compliance Progress', `${readinessData.completedCount} / ${readinessData.totalRequiredCount} items satisfied`);

    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('6-POINT COMPLIANCE CHECKLIST:', 15, yPos);
    yPos += 8;

    readinessData.checklist?.forEach((item: any) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      const icon = item.completed ? '[PASS ✓]' : '[FAIL ✗]';
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(item.completed ? 16 : 225, item.completed ? 185 : 29, item.completed ? 129 : 72);
      doc.text(`${icon} ${item.title}`, 15, yPos);

      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const expLines = doc.splitTextToSize(item.explanation || '', 175);
      doc.text(expLines, 20, yPos + 5);
      yPos += (expLines.length * 5) + 8;
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const uploadDir = this.ensureUploadDirectory();
    const sanitizedFileName = `Readiness_Report_${projectId.substring(0, 8)}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, sanitizedFileName);

    fs.writeFileSync(filePath, pdfBuffer);

    const fileUrl = `/uploads/documents/${sanitizedFileName}`;

    const document = await prisma.document.create({
      data: {
        name: `Filing Readiness Report (${project.title})`,
        fileUrl,
        fileType: 'application/pdf',
        fileSize: pdfBuffer.length,
        version: 1,
        category: 'PATENT_DRAFT',
        projectId
      }
    });

    return document;
  }

  /**
   * Generates a server-side Technical Patent Figure Preparation Sheet PDF.
   */
  static async generatePatentFigureSheetPdf(projectId: string, figureId: string, userId?: string): Promise<any> {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: { owner: { select: { fullName: true, email: true, institution: true } } }
    });

    if (!project) {
      throw new Error('Project not found for figure sheet generation.');
    }

    const figure = await prisma.drawingFigure.findUnique({
      where: { id: figureId },
      include: {
        components: { orderBy: { referenceNumber: 'asc' } },
        sourceDocument: true
      }
    });

    if (!figure || figure.projectId !== projectId) {
      throw new Error('Drawing figure not found or project mismatch.');
    }

    const doc = new jsPDF();

    // Border Frame for Official Layout
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);

    // Sheet Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`PATENT FIGURE PREPARATION SHEET`, 15, 22);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${project.title} (${project.category})`, 15, 28);
    doc.text(`Applicant: ${project.owner.fullName}`, 15, 33);

    doc.setDrawColor(200, 200, 200);
    doc.line(15, 36, 195, 36);

    // Figure Title Banner
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${figure.figureNumber} - ${figure.title}`, 15, 47);

    if (figure.description) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      const splitDesc = doc.splitTextToSize(figure.description, 180);
      doc.text(splitDesc, 15, 53);
    }

    // Schematic Drawing Bounding Box
    let yPos = figure.description ? 65 : 55;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(15, yPos, 180, 110, 'FD');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`[2D SCHEMATIC LAYOUT REPRESENTATION]`, 45, yPos + 20);

    // Draw reference tags in bounding box
    let tagY = yPos + 35;
    let tagX = 25;
    figure.components.slice(0, 8).forEach((comp, idx) => {
      doc.setFillColor(79, 70, 229);
      doc.circle(tagX, tagY, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(comp.referenceNumber, tagX - 2.5, tagY + 1.5);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`─── ${comp.componentName}`, tagX + 6, tagY + 1.5);

      tagY += 16;
      if (tagY > yPos + 95) {
        tagY = yPos + 35;
        tagX += 85;
      }
    });

    // Reference Components Table Legend
    yPos += 120;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('COMPONENT REFERENCE LEGEND TABLE:', 15, yPos);

    yPos += 5;
    doc.setDrawColor(203, 213, 225);
    doc.line(15, yPos, 195, yPos);

    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Ref #', 15, yPos);
    doc.text('Component Name', 40, yPos);
    doc.text('Description', 100, yPos);

    yPos += 4;
    doc.line(15, yPos, 195, yPos);
    yPos += 5;

    if (figure.components.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.text('No component reference tags cataloged for this figure.', 15, yPos);
      yPos += 10;
    } else {
      figure.components.forEach((comp) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(comp.referenceNumber, 15, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(comp.componentName, 40, yPos);
        const splitCompDesc = doc.splitTextToSize(comp.description || 'N/A', 90);
        doc.text(splitCompDesc, 100, yPos);
        yPos += (splitCompDesc.length * 4) + 3;
      });
    }

    // Disclaimer footer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    doc.text('Note: Patent figure preparation sheet. AI-assisted technical drawing draft. Not an official IPO/USPTO filing document.', 15, 283);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const uploadDir = this.ensureUploadDirectory();
    const sanitizedFileName = `Figure_${figure.figureNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${projectId.substring(0, 8)}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, sanitizedFileName);

    fs.writeFileSync(filePath, pdfBuffer);

    const fileUrl = `/uploads/documents/${sanitizedFileName}`;

    const document = await prisma.document.create({
      data: {
        name: `${figure.figureNumber} Sheet - ${figure.title}.pdf`,
        fileUrl,
        fileType: 'application/pdf',
        fileSize: pdfBuffer.length,
        version: 1,
        category: 'PATENT_DRAFT',
        projectId
      }
    });

    // Update DrawingFigure generatedDocumentId
    await prisma.drawingFigure.update({
      where: { id: figure.id },
      data: { generatedDocumentId: document.id }
    });

    if (userId) {
      try {
        await prisma.activityLog.create({
          data: {
            userId,
            projectId,
            action: `Generated Technical Figure Sheet PDF for ${figure.figureNumber}.`
          }
        });
      } catch (e) {
        // Ignore activity log creation in mock/test environments
      }
    }

    return document;
  }
}
