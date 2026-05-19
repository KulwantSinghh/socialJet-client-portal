import type { CampaignProgress } from '@/types';
import styles from './ProgressView.module.css';

interface ProgressViewProps {
  progress: CampaignProgress;
}

export function ProgressView({ progress }: ProgressViewProps) {
  return (
    <div className={styles.container}>
      {/* Overall Completion */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Overall Completion</h3>
        <div className={styles.completionRow}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress.overall_completion_percentage}%` }}
            />
          </div>
          <span className={styles.completionPct}>
            {progress.overall_completion_percentage}%
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h4 className={styles.statCardTitle}>Creator Stats</h4>
          <ul className={styles.statList}>
            <StatRow label="Total" value={progress.creator_stats.total} />
            <StatRow label="Assigned" value={progress.creator_stats.assigned} />
            <StatRow label="CM Approved" value={progress.creator_stats.cm_approved} />
            <StatRow
              label="Client Approved"
              value={progress.creator_stats.client_approved}
              highlight="success"
            />
            <StatRow
              label="Client Rejected"
              value={progress.creator_stats.client_rejected}
              highlight="error"
            />
          </ul>
        </div>

        <div className={styles.statCard}>
          <h4 className={styles.statCardTitle}>Content Stats</h4>
          <ul className={styles.statList}>
            <StatRow label="Total" value={progress.content_stats.total} />
            <StatRow label="Submitted" value={progress.content_stats.submitted} />
            <StatRow label="CM Approved" value={progress.content_stats.cm_approved} />
            <StatRow
              label="Client Approved"
              value={progress.content_stats.client_approved}
              highlight="success"
            />
            <StatRow
              label="Client Rejected"
              value={progress.content_stats.client_rejected}
              highlight="error"
            />
            <StatRow label="Scheduled" value={progress.content_stats.scheduled} />
          </ul>
        </div>
      </div>

      {/* Timeline */}
      {progress.timeline.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Phase Timeline</h3>
          <div className={styles.timeline}>
            {progress.timeline.map((phase) => (
              <div
                key={phase.phase}
                className={`${styles.phase} ${
                  phase.status === 'completed'
                    ? styles.phaseCompleted
                    : phase.status === 'in_progress'
                    ? styles.phaseInProgress
                    : styles.phaseUpcoming
                }`}
              >
                <div className={styles.phaseDot} />
                <div className={styles.phaseContent}>
                  <span className={styles.phaseLabel}>{phase.label}</span>
                  <span className={styles.phaseDates}>
                    {new Date(phase.start_date).toLocaleDateString()} &mdash;{' '}
                    {new Date(phase.end_date).toLocaleDateString()}
                  </span>
                </div>
                <span className={styles.phaseStatus}>{phase.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {progress.milestones.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Milestones</h3>
          <ul className={styles.milestones}>
            {progress.milestones.map((m, i) => (
              <li
                key={i}
                className={`${styles.milestone} ${m.completed ? styles.milestoneCompleted : ''}`}
              >
                <span className={styles.milestoneCheck}>{m.completed ? '✓' : '○'}</span>
                <span className={styles.milestoneLabel}>{m.label}</span>
                <span className={styles.milestoneDate}>
                  {new Date(m.date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: number;
  highlight?: 'success' | 'error';
}

function StatRow({ label, value, highlight }: StatRowProps) {
  return (
    <li className={styles.statRow}>
      <span className={styles.statLabel}>{label}</span>
      <span
        className={`${styles.statValue} ${
          highlight === 'success'
            ? styles.statSuccess
            : highlight === 'error'
            ? styles.statError
            : ''
        }`}
      >
        {value}
      </span>
    </li>
  );
}
