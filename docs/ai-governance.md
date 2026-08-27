# AI & Operational Intelligence Governance Policy

## Mandatory Human-in-the-Loop Decision Boundary
In strict adherence to institutional safety standards:
- **NO Autonomous Disciplinary Actions**: AI algorithms are strictly forbidden from expelling students, rejecting admissions, altering grades, suspending users, modifying permissions, or altering attendance records.
- **Explainability Requirement**: Every operational recommendation (`OperationalRecommendation`) includes `evidenceJson` citing the exact database query counts or records that triggered the observation.
- **Review Controls**: Institutional administrators must explicitly review and either `ACKNOWLEDGE`, `IN_PROGRESS`, `RESOLVED`, or `DISMISSED` (with mandatory dismissal reason) all system recommendations.
