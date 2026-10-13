// Compact by default: keep actionable selection/size data without absolute scan paths.
export function formatBuildReport(report, mode = 'compact') {
  if (mode === 'full') return report;
  const { reasons, discovery, ...summary } = report;
  return { ...summary, discovery: discovery && {
    components: discovery.components, services: discovery.services,
    fileCount: discovery.files.length, rootCount: discovery.roots.length,
  } };
}
