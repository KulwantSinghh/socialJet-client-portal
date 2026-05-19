'use client';

import { useState } from 'react';
import { use } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { CreatorCard } from '@/components/CreatorCard';
import { ContentCard } from '@/components/ContentCard';
import { ProgressView } from '@/components/ProgressView';
import { useCampaign } from '@/hooks/useCampaigns';
import { useCreators, useApproveCreator, useRejectCreator } from '@/hooks/useCreators';
import { useContent, useApproveContent, useRejectContent } from '@/hooks/useContent';
import { useProgress } from '@/hooks/useProgress';
import styles from './campaignDetail.module.css';

type Tab = 'overview' | 'creators' | 'content' | 'progress';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'creators', label: 'Creators' },
  { id: 'content', label: 'Content' },
  { id: 'progress', label: 'Progress' },
];

interface PageProps {
  params: Promise<{ campaign_id: string }>;
}

export default function CampaignDetailPage({ params }: PageProps) {
  const { campaign_id } = use(params);

  return (
    <AuthGuard>
      <Navbar />
      <CampaignDetail campaignId={campaign_id} />
    </AuthGuard>
  );
}

function CampaignDetail({ campaignId }: { campaignId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: campaign, isLoading, isError } = useCampaign(campaignId);

  if (isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.skeleton} />
      </main>
    );
  }

  if (isError || !campaign) {
    return (
      <main className={styles.main}>
        <p className={styles.errorText}>Failed to load campaign.</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      {/* Campaign header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <p className={styles.brand}>{campaign.brand}</p>
          <h1 className={styles.title}>{campaign.name}</h1>
        </div>
        <span
          className={`${styles.status} ${
            campaign.status === 'active' ? styles.statusActive : styles.statusDefault
          }`}
        >
          {campaign.status}
        </span>
      </div>

      {/* Tabs */}
      <nav className={styles.tabs} aria-label="Campaign sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div className={styles.content}>
        {activeTab === 'overview' && <OverviewTab campaign={campaign} />}
        {activeTab === 'creators' && <CreatorsTab campaignId={campaignId} />}
        {activeTab === 'content' && <ContentTab campaignId={campaignId} />}
        {activeTab === 'progress' && <ProgressTab campaignId={campaignId} />}
      </div>
    </main>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────

import type { Campaign } from '@/types';

function OverviewTab({ campaign }: { campaign: Campaign }) {
  return (
    <div className={styles.overview}>
      {campaign.description && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Description</h2>
          <p className={styles.bodyText}>{campaign.description}</p>
        </section>
      )}

      {campaign.objectives && campaign.objectives.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Objectives</h2>
          <ul className={styles.objectiveList}>
            {campaign.objectives.map((obj, i) => (
              <li key={i} className={styles.objectiveItem}>
                {obj}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Details</h2>
        <dl className={styles.detailGrid}>
          <div className={styles.detail}>
            <dt className={styles.detailLabel}>Start date</dt>
            <dd className={styles.detailValue}>
              {new Date(campaign.start_date).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </dd>
          </div>
          <div className={styles.detail}>
            <dt className={styles.detailLabel}>End date</dt>
            <dd className={styles.detailValue}>
              {new Date(campaign.end_date).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </dd>
          </div>
          <div className={styles.detail}>
            <dt className={styles.detailLabel}>Budget</dt>
            <dd className={styles.detailValue}>
              {campaign.currency} {campaign.budget.toLocaleString()}
            </dd>
          </div>
          <div className={styles.detail}>
            <dt className={styles.detailLabel}>Status</dt>
            <dd className={styles.detailValue}>{campaign.status}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

// ─── Creators Tab ──────────────────────────────────────────────────────────

function CreatorsTab({ campaignId }: { campaignId: string }) {
  const { data, isLoading, isError } = useCreators(campaignId);
  const { mutate: approve, isPending: approving } = useApproveCreator(campaignId);
  const { mutate: reject, isPending: rejecting } = useRejectCreator(campaignId);

  if (isLoading) return <LoadingGrid />;
  if (isError) return <ErrorMessage message="Failed to load creators." />;

  const creators = data?.creators ?? [];

  if (creators.length === 0) {
    return <EmptyMessage message="No creators assigned to this campaign yet." />;
  }

  return (
    <div className={styles.grid}>
      {creators.map((creator) => (
        <CreatorCard
          key={creator.id}
          creator={creator}
          onApprove={(id) => approve({ creatorId: id })}
          onReject={(id) => reject({ creatorId: id })}
          isLoading={approving || rejecting}
        />
      ))}
    </div>
  );
}

// ─── Content Tab ───────────────────────────────────────────────────────────

function ContentTab({ campaignId }: { campaignId: string }) {
  const { data, isLoading, isError } = useContent(campaignId);
  const { mutate: approve, isPending: approving } = useApproveContent(campaignId);
  const { mutate: reject, isPending: rejecting } = useRejectContent(campaignId);

  if (isLoading) return <LoadingGrid />;
  if (isError) return <ErrorMessage message="Failed to load content." />;

  const items = data?.content ?? [];

  if (items.length === 0) {
    return <EmptyMessage message="No content submitted yet." />;
  }

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <ContentCard
          key={item.id}
          content={item}
          onApprove={(id) => approve({ contentId: id })}
          onReject={(id) => reject({ contentId: id })}
          isLoading={approving || rejecting}
        />
      ))}
    </div>
  );
}

// ─── Progress Tab ──────────────────────────────────────────────────────────

function ProgressTab({ campaignId }: { campaignId: string }) {
  const { data, isLoading, isError } = useProgress(campaignId);

  if (isLoading) return <LoadingGrid />;
  if (isError || !data) return <ErrorMessage message="Failed to load progress." />;

  return <ProgressView progress={data} />;
}

// ─── Shared sub-components ────────────────────────────────────────────────

function LoadingGrid() {
  return (
    <div className={styles.loadingGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.skeletonCard} />
      ))}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className={styles.errorState}>
      <p className={styles.errorText}>{message}</p>
    </div>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyText}>{message}</p>
    </div>
  );
}
