import cloudinary from '../configs/cloudinary.config';
import { normalizeJurisdiction } from './jurisdiction.util';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface UserAuth {
  role?: string;
  email?: string | null;
  division?: string | null;
  district?: string | null;
  upazila?: string | null;
}

export interface LabWhereClause {
  [key: string]: any;
}

// ─────────────────────────────────────────────
// 1. Role-based WHERE clause builder
//    Replaces the copy-pasted scoping block in every controller function.
// ─────────────────────────────────────────────

export function buildRoleScope(user: UserAuth | undefined): LabWhereClause {
  if (!user || user.role === 'SuperAdmin') return {};

  if (user.role === 'DistrictAdmin' && user.district) {
    return { district: { in: normalizeJurisdiction(user.district) } };
  }

  if (user.role === 'DivisionAdmin' && user.division) {
    return { division: { in: normalizeJurisdiction(user.division) } };
  }

  if (user.role === 'LabAdmin') {
    return user.email ? { email: { equals: user.email, mode: 'insensitive' } } : { id: -1 }; // no match sentinel
  }

  // Granular roles (Upazila-level, etc.)
  const scope: LabWhereClause = {};
  if (user.division) scope.division = { in: normalizeJurisdiction(user.division) };
  if (user.district) scope.district = { in: normalizeJurisdiction(user.district) };
  if (user.upazila) scope.upazila = user.upazila;
  return scope;
}

// ─────────────────────────────────────────────
// 2. Jurisdiction filter builder (query-param layer)
//    Applied on top of role scope.
// ─────────────────────────────────────────────

export function applyJurisdictionFilters(
  where: LabWhereClause,
  query: { division?: any; district?: any; upazila?: any; labType?: any },
): void {
  const { division, district, upazila, labType } = query;

  if (division && division !== 'All') {
    where.division = { in: normalizeJurisdiction(division as string) };
  }
  if (district && district !== 'All') {
    where.district = { in: normalizeJurisdiction(district as string) };
  }
  if (upazila && upazila !== 'All') {
    where.upazila = upazila as string;
  }
  if (labType && labType !== 'All') {
    where.lab_type = labType as string;
  }
}

// ─────────────────────────────────────────────
// 3. Search OR clause builder
// ─────────────────────────────────────────────

export function buildSearchClause(search: string, includeUserRelation = false): object[] {
  const base = [
    { institute: { contains: search, mode: 'insensitive' } },
    { head: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
    { mobile: { contains: search, mode: 'insensitive' } },
    { division: { contains: search, mode: 'insensitive' } },
    { district: { contains: search, mode: 'insensitive' } },
  ];

  if (includeUserRelation) {
    return [
      ...base,
      { user: { userName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { phoneNumber: { contains: search, mode: 'insensitive' } } },
    ];
  }

  return base;
}

// ─────────────────────────────────────────────
// 4. Multipart image consolidator
//    Replaces the duplicated getImages() helper in both controllers.
//    Max 2 images per field, deduped.
// ─────────────────────────────────────────────

export function consolidateImages(
  fieldName: string,
  body: Record<string, any>,
  files: Record<string, Express.Multer.File[]> | undefined,
  maxImages = 2,
): string[] | undefined {
  const hasFiles = (files?.[fieldName]?.length ?? 0) > 0;
  const hasBody = body[fieldName] !== undefined;

  if (!hasFiles && !hasBody) return undefined;

  const raw: string[] = [];

  const bodyValue = body[fieldName];
  if (bodyValue) {
    const process = (val: any) => {
      if (typeof val !== 'string') return;
      const trimmed = val.trim();
      if (!trimmed) return;
      raw.push(
        ...trimmed
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
      );
    };
    if (Array.isArray(bodyValue)) {
      bodyValue.forEach(process);
    } else {
      process(bodyValue);
    }
  }

  if (hasFiles) {
    raw.push(...files![fieldName].map((f) => (f as any).path));
  }

  return [...new Set(raw)]
    .filter((img) => typeof img === 'string' && img !== '')
    .slice(0, maxImages);
}

// ─────────────────────────────────────────────
// 5. Cloudinary batch deletion
//    Replaces duplicated deletion loops in both controllers.
// ─────────────────────────────────────────────

export async function deleteCloudinaryImages(
  deletedImages: string | string[] | undefined,
  existingImages: Set<string>,
  keepImages: (string[] | undefined)[],
): Promise<void> {
  if (!deletedImages) return;

  let toDelete: string[];
  try {
    toDelete =
      typeof deletedImages === 'string'
        ? JSON.parse(deletedImages)
        : Array.isArray(deletedImages)
          ? deletedImages
          : [];
  } catch (e) {
    console.error('❌ Error parsing deletedImages:', e);
    return;
  }

  const keepSet = new Set(keepImages.flat().filter(Boolean) as string[]);

  for (const url of toDelete) {
    if (!existingImages.has(url) || keepSet.has(url)) continue;

    try {
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1) continue;

      const publicIdParts = parts.slice(uploadIndex + 1);
      if (publicIdParts[0]?.match(/^v\d+$/)) publicIdParts.shift();
      const publicId = publicIdParts.join('/').split('.')[0];

      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error(`❌ Cloudinary deletion failed for ${url}:`, err);
    }
  }
}

// ─────────────────────────────────────────────
// 6. Jurisdiction access guard (read / update)
//    Returns an error message string, or null if access is granted.
// ─────────────────────────────────────────────

interface LabRecord {
  email?: string | null;
  division?: string | null;
  district?: string | null;
  upazila?: string | null;
}

export function checkJurisdictionAccess(
  user: UserAuth | undefined,
  lab: LabRecord,
  ownEmailField: keyof LabRecord = 'email',
): string | null {
  if (!user || user.role === 'SuperAdmin') return null;

  if (user.role === 'LabAdmin') {
    const labEmail = lab[ownEmailField] as string | null;
    if (!labEmail || labEmail.toLowerCase() !== user.email?.toLowerCase()) {
      return 'Access denied: this is not your lab';
    }
    return null;
  }

  if (user.role === 'DistrictAdmin') {
    const normalizedDist = user.district ? normalizeJurisdiction(user.district) : [];
    if (!normalizedDist.includes(lab.district || '')) {
      return 'Access denied: outside your district';
    }
    return null;
  }

  // DivisionAdmin / generic roles
  if (user.division) {
    const normalizedDiv = normalizeJurisdiction(user.division);
    if (!normalizedDiv.includes(lab.division || '')) {
      return 'Access denied: outside your division';
    }
  }
  if (user.district) {
    const normalizedDist = normalizeJurisdiction(user.district);
    if (!normalizedDist.includes(lab.district || '')) {
      return 'Access denied: outside your district';
    }
  }
  if (user.upazila && lab.upazila !== user.upazila) {
    return 'Access denied: outside your upazila';
  }

  return null;
}
