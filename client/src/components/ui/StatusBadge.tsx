import React from 'react';
import { Badge, type BadgeVariant } from './Badge';

export interface StatusBadgeProps {
  status?: string | null;
  type?: 'stage' | 'review' | 'readiness' | 'priority' | 'generic';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'PENDING',
  type = 'generic',
  className = '',
}) => {
  const normalized = String(status || '').toUpperCase().trim();

  // Project stages mapping
  if (type === 'stage' || normalized.includes('IDEA') || normalized.includes('FILING') || normalized.includes('REVIEW')) {
    const stageMap: Record<string, { label: string; variant: BadgeVariant }> = {
      IDEA: { label: 'Idea Concept', variant: 'charcoal' },
      LITERATURE_REVIEW: { label: 'Prior Art Search', variant: 'blue' },
      PROTOTYPE: { label: 'Prototype & Drawings', variant: 'lavender' },
      DOCUMENTATION: { label: 'Specification Drafting', variant: 'teal' },
      FORMS_PREPARATION: { label: 'Forms Preparation', variant: 'sage' },
      GUIDE_REVIEW: { label: 'Guide Review', variant: 'amber' },
      PATENT_EXPERT_REVIEW: { label: 'Patent Expert Review', variant: 'amber' },
      CHANGES_REQUESTED: { label: 'Changes Requested', variant: 'rose' },
      FILING_READY: { label: 'Filing Ready', variant: 'emerald' },
      FILED: { label: 'Application Filed', variant: 'emerald' },
      GRANTED: { label: 'Patent Granted', variant: 'emerald' },
      ABANDONED: { label: 'Abandoned', variant: 'rose' },
    };

    const match = stageMap[normalized];
    if (match) {
      return (
        <Badge variant={match.variant} dot className={className}>
          {match.label}
        </Badge>
      );
    }
  }

  // Review decisions
  if (type === 'review' || ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'PENDING'].includes(normalized)) {
    const reviewMap: Record<string, { label: string; variant: BadgeVariant }> = {
      APPROVED: { label: 'Approved', variant: 'emerald' },
      REJECTED: { label: 'Rejected', variant: 'rose' },
      CHANGES_REQUESTED: { label: 'Needs Revisions', variant: 'rose' },
      PENDING: { label: 'Under Review', variant: 'amber' },
    };

    const match = reviewMap[normalized];
    if (match) {
      return (
        <Badge variant={match.variant} dot className={className}>
          {match.label}
        </Badge>
      );
    }
  }

  // Task Priority
  if (type === 'priority' || ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(normalized)) {
    const priorityMap: Record<string, { label: string; variant: BadgeVariant }> = {
      CRITICAL: { label: 'Critical', variant: 'rose' },
      URGENT: { label: 'Urgent', variant: 'rose' },
      HIGH: { label: 'High Priority', variant: 'amber' },
      MEDIUM: { label: 'Normal', variant: 'teal' },
      LOW: { label: 'Low', variant: 'charcoal' },
    };

    const match = priorityMap[normalized];
    if (match) {
      return (
        <Badge variant={match.variant} dot className={className}>
          {match.label}
        </Badge>
      );
    }
  }

  // Generic fallback
  const label = normalized.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const variant: BadgeVariant =
    normalized.includes('ACTIVE') || normalized.includes('SUCCESS') || normalized.includes('COMPLETE')
      ? 'emerald'
      : normalized.includes('WAIT') || normalized.includes('PEND')
      ? 'amber'
      : normalized.includes('ERR') || normalized.includes('FAIL')
      ? 'rose'
      : 'teal';

  return (
    <Badge variant={variant} dot className={className}>
      {label || 'Unknown'}
    </Badge>
  );
};
