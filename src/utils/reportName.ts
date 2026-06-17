const REPORT_NAME_SUFFIX = '\u6570\u636e\u5b89\u5168\u98ce\u9669\u8bc4\u4f30\u62a5\u544a';

export interface DefaultReportNameParts {
  companyName?: string | null;
  projectName?: string | null;
}

export const buildDefaultReportName = ({ companyName, projectName }: DefaultReportNameParts) => {
  const parts = [companyName, projectName]
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  return [...(parts.length ? parts : ['\u9879\u76ee']), REPORT_NAME_SUFFIX].join('-');
};
