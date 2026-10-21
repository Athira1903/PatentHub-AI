export type NormalizedRole =
  | 'INVENTOR'
  | 'CO_INVENTOR'
  | 'GUIDE'
  | 'PATENT_EXPERT'
  | 'ADMIN'
  | 'ORGANIZATION_ADMIN';

/**
 * Normalizes any role representation (string, object with name/role, different casings or separators)
 * into a standard NormalizedRole.
 */
export function normalizeUserRole(role: any): NormalizedRole {
  if (!role) return 'INVENTOR';
  const rawRole = typeof role === 'object' && role !== null ? (role.name || role.role || '') : String(role);
  const clean = String(rawRole).trim().toLowerCase().replace(/[\s_-]/g, '');

  if (clean === 'guide' || clean === 'faculty' || clean === 'facultyguide') {
    return 'GUIDE';
  }
  if (clean === 'patentexpert' || clean === 'attorney' || clean === 'expert' || clean === 'examiner') {
    return 'PATENT_EXPERT';
  }
  if (clean === 'coinventor' || clean === 'collaborator' || clean === 'coinventer') {
    return 'CO_INVENTOR';
  }
  if (clean === 'admin' || clean === 'administrator' || clean === 'systemadmin') {
    return 'ADMIN';
  }
  if (clean === 'organizationadmin' || clean === 'orgadmin' || clean === 'organizationadministrator') {
    return 'ORGANIZATION_ADMIN';
  }
  return 'INVENTOR';
}

/**
 * Returns a human-friendly display name for the user's role.
 */
export function getRoleDisplayName(role: any): string {
  const normalized = normalizeUserRole(role);
  switch (normalized) {
    case 'INVENTOR':
      return 'Lead Inventor';
    case 'CO_INVENTOR':
      return 'Co-Inventor';
    case 'GUIDE':
      return 'Faculty Guide';
    case 'PATENT_EXPERT':
      return 'Patent Expert';
    case 'ADMIN':
      return 'Administrator';
    case 'ORGANIZATION_ADMIN':
      return 'Organization Admin';
  }
}

/**
 * Returns the portal subtitle shown below PatentHub AI brand in the layout.
 */
export function getPortalName(role: any): string {
  const normalized = normalizeUserRole(role);
  switch (normalized) {
    case 'INVENTOR':
      return 'Inventor Portal';
    case 'CO_INVENTOR':
      return 'Co-Inventor Portal';
    case 'GUIDE':
      return 'Guide Portal';
    case 'PATENT_EXPERT':
      return 'Patent Expert Portal';
    case 'ADMIN':
      return 'Admin Central';
    case 'ORGANIZATION_ADMIN':
      return 'Organization Portal';
  }
}

/**
 * Returns the breadcrumb workspace title for the main dashboard.
 */
export function getWorkspaceTitle(role: any): string {
  const normalized = normalizeUserRole(role);
  switch (normalized) {
    case 'INVENTOR':
      return 'Inventor Dashboard';
    case 'CO_INVENTOR':
      return 'Co-Inventor Workspace';
    case 'GUIDE':
      return 'Guide Workspace';
    case 'PATENT_EXPERT':
      return 'Patent Expert Workspace';
    case 'ADMIN':
      return 'Admin Dashboard';
    case 'ORGANIZATION_ADMIN':
      return 'Organization Dashboard';
  }
}

/**
 * Returns a 2-character avatar initials based on name or role.
 */
export function getRoleInitials(name?: string, role?: any): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const normalized = normalizeUserRole(role);
  switch (normalized) {
    case 'INVENTOR':
      return 'IN';
    case 'CO_INVENTOR':
      return 'CO';
    case 'GUIDE':
      return 'GD';
    case 'PATENT_EXPERT':
      return 'PE';
    case 'ADMIN':
      return 'AD';
    case 'ORGANIZATION_ADMIN':
      return 'OA';
  }
}
