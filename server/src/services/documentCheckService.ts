import { Scheme, DocumentVerificationStatus, ApplicationDraft } from '../../../shared/types';

/**
 * Document Verification & Application Readiness Service
 * Analyzes document availability and pre-fills application drafts.
 */
export class DocumentCheckService {
  public static verifySchemeDocuments(
    scheme: Scheme,
    availableDocs: string[] = []
  ): DocumentVerificationStatus[] {
    const required = scheme.documentsRequired || [];

    return required.map((docName) => {
      const docLower = docName.toLowerCase();
      const isAvailable = availableDocs.some((d) => d.toLowerCase().includes(docLower) || docLower.includes(d.toLowerCase()));

      return {
        documentName: docName,
        isAvailable,
        statusText: isAvailable ? 'Verified & Available' : 'Missing / Required',
        recommendedAction: isAvailable
          ? 'Keep original copy ready for verification'
          : `Obtain copy from official Kendra / portal before applying for ${scheme.name}`
      };
    });
  }

  public static generateApplicationDraft(
    scheme: Scheme,
    applicantName: string,
    language: string,
    profileData: Record<string, string>
  ): ApplicationDraft {
    const checklist = this.verifySchemeDocuments(scheme, Object.keys(profileData));

    return {
      schemeId: scheme.schemeId,
      schemeName: scheme.name,
      applicantName,
      language,
      prefilledFields: {
        'Applicant Name': applicantName,
        'Scheme Name': scheme.name,
        'Ministry / Department': scheme.ministryOrDepartment,
        'Financial Benefit': scheme.financialBenefit,
        'Official Application URL': scheme.applicationUrl,
        ...profileData
      },
      checklist,
      generatedDate: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    };
  }
}
