import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  TravelBudgetData,
  TripOption,
} from '@/lib/travelBudget/types';
import {
  backupTravelBudgetData,
  clearTravelBudgetData,
  exportTravelBudgetToFile,
  getDefaultTravelBudgetData,
  importTravelBudgetFromFile,
  loadTravelBudgetData,
  makeNewOption,
  saveTravelBudgetData,
} from '@/lib/travelBudget/storage';
import { buildShareUrl, decodeShareLink } from '@/lib/travelBudget/share';
import TripInfoTab from '@/components/travelBudget/TripInfoTab';
import OptionTab from '@/components/travelBudget/OptionTab';
import SummaryTab from '@/components/travelBudget/SummaryTab';
import ShareLinkModal from '@/components/travelBudget/ShareLinkModal';

type ActiveTab = 'tripInfo' | 'summary' | string;

export default function TravelBudgetPage() {
  const router = useRouter();
  const [data, setData] = useState<TravelBudgetData>(getDefaultTravelBudgetData());
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('tripInfo');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [pendingShare, setPendingShare] = useState<TravelBudgetData | null>(null);
  const [shareModal, setShareModal] = useState<{ open: boolean; url: string }>({
    open: false,
    url: '',
  });
  const [importError, setImportError] = useState<string | null>(null);

  // Load from localStorage on first mount
  useEffect(() => {
    const loaded = loadTravelBudgetData();
    if (loaded) setData(loaded);
    setHydrated(true);
  }, []);

  // Persist after hydration. Don't persist before, otherwise the default data
  // would overwrite a real saved value before we got to read it.
  useEffect(() => {
    if (!hydrated) return;
    saveTravelBudgetData(data);
  }, [data, hydrated]);

  // Look at ?d=... once the router is ready
  useEffect(() => {
    if (!router.isReady) return;
    const param = router.query.d;
    if (typeof param !== 'string' || !param) return;
    const decoded = decodeShareLink(param);
    if (decoded) {
      setPendingShare(decoded);
    } else {
      setImportError(
        'The shared link could not be decoded. It may be corrupted or truncated.',
      );
    }
  }, [router.isReady, router.query.d]);

  const handleAddOption = () => {
    const newOpt = makeNewOption({
      dayCount: data.tripInfo.defaultDays,
    });
    setData((prev) => ({ ...prev, options: [...prev.options, newOpt] }));
    setActiveTab(newOpt.id);
  };

  const handleUpdateOption = (updated: TripOption) => {
    setData((prev) => ({
      ...prev,
      options: prev.options.map((o) => (o.id === updated.id ? updated : o)),
    }));
  };

  const handleDuplicateOption = (id: string) => {
    const source = data.options.find((o) => o.id === id);
    if (!source) return;
    const clone: TripOption = JSON.parse(JSON.stringify(source));
    clone.id = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    clone.name = `${source.name} (Copy)`;
    clone.lineItems = clone.lineItems.map((li) => ({
      ...li,
      id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }));
    setData((prev) => ({ ...prev, options: [...prev.options, clone] }));
    setActiveTab(clone.id);
  };

  const handleDeleteOption = (id: string) => {
    setData((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o.id !== id),
    }));
    setActiveTab('tripInfo');
  };

  const handleExport = () => exportTravelBudgetToFile(data);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importTravelBudgetFromFile(file);
      setData(imported);
      setActiveTab('tripInfo');
      setImportError(null);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Error importing file',
      );
    } finally {
      // allow re-importing the same file
      e.target.value = '';
    }
  };

  const handleClear = () => {
    clearTravelBudgetData();
    const fresh = getDefaultTravelBudgetData();
    setData(fresh);
    setActiveTab('tripInfo');
    setShowClearConfirm(false);
  };

  const handleShare = () => {
    const url = buildShareUrl(data);
    setShareModal({ open: true, url });
  };

  const handleLoadShared = () => {
    if (!pendingShare) return;
    backupTravelBudgetData(data);
    setData(pendingShare);
    setPendingShare(null);
    setActiveTab('tripInfo');
    // Strip ?d= so reloading doesn't re-prompt
    router.replace('/travelBudget', undefined, { shallow: true });
  };

  const handleDismissShared = () => {
    setPendingShare(null);
    router.replace('/travelBudget', undefined, { shallow: true });
  };

  const sharedPreviewLabel = useMemo(() => {
    if (!pendingShare) return '';
    return `${pendingShare.tripInfo.destination || 'Shared trip'} — ${
      pendingShare.options.length
    } option${pendingShare.options.length === 1 ? '' : 's'}`;
  }, [pendingShare]);

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 bg-base-100 text-base-content">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary">
              Travel Budget
            </h1>
            <p className="text-sm text-base-content/70 mt-1">
              Compare trip options side-by-side — different lodging, ticket types,
              add-ons, or trip lengths.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="btn btn-sm btn-primary"
            >
              Share Link
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="btn btn-sm btn-outline btn-primary"
            >
              Export
            </button>
            <label className="btn btn-sm btn-outline btn-primary">
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="btn btn-sm btn-outline btn-error"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Shared link banner */}
        {pendingShare && (
          <div className="alert alert-info mb-4">
            <div className="flex-1">
              <div className="font-semibold">A shared budget is in this link</div>
              <div className="text-sm opacity-90">{sharedPreviewLabel}</div>
              <div className="text-xs opacity-75 mt-1">
                Loading will replace your current options. Your existing data will
                be saved as a backup in localStorage.
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleLoadShared}
              >
                Load shared
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={handleDismissShared}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Import error */}
        {importError && (
          <div className="alert alert-error mb-4">
            <span>{importError}</span>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setImportError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab strip */}
        <div className="tabs tabs-lifted w-full">
          <input
            type="radio"
            name="travel_tabs"
            role="tab"
            className="tab text-base font-medium"
            aria-label="Trip Info"
            checked={activeTab === 'tripInfo'}
            onChange={() => setActiveTab('tripInfo')}
          />
          <div
            role="tabpanel"
            className="tab-content bg-base-200 border-base-300 rounded-box p-6"
          >
            <TripInfoTab
              tripInfo={data.tripInfo}
              onUpdate={(info) =>
                setData((prev) => ({ ...prev, tripInfo: info }))
              }
            />
          </div>

          {data.options.map((option) => (
            <React.Fragment key={option.id}>
              <input
                type="radio"
                name="travel_tabs"
                role="tab"
                className="tab text-base font-medium"
                aria-label={option.name || 'Option'}
                checked={activeTab === option.id}
                onChange={() => setActiveTab(option.id)}
              />
              <div
                role="tabpanel"
                className="tab-content bg-base-200 border-base-300 rounded-box p-6"
              >
                <OptionTab
                  option={option}
                  travelers={data.tripInfo.travelers}
                  sharedItems={data.tripInfo.sharedItems}
                  onUpdate={handleUpdateOption}
                  onDuplicate={() => handleDuplicateOption(option.id)}
                  onDelete={() => handleDeleteOption(option.id)}
                />
              </div>
            </React.Fragment>
          ))}

          <button
            type="button"
            className="tab text-base font-medium hover:bg-base-200"
            onClick={handleAddOption}
            title="Add new option"
          >
            + Add Option
          </button>

          <input
            type="radio"
            name="travel_tabs"
            role="tab"
            className="tab text-base font-medium"
            aria-label="Summary"
            checked={activeTab === 'summary'}
            onChange={() => setActiveTab('summary')}
            disabled={data.options.length === 0}
          />
          <div
            role="tabpanel"
            className="tab-content bg-base-200 border-base-300 rounded-box p-6"
          >
            <SummaryTab
              options={data.options}
              travelers={data.tripInfo.travelers}
              sharedItems={data.tripInfo.sharedItems}
            />
          </div>
        </div>
      </div>

      {/* Clear confirm */}
      {showClearConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Clear all travel budget data?</h3>
            <p className="py-4">
              This wipes your current options and resets to the starter example.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-error"
                onClick={handleClear}
              >
                Clear Everything
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ShareLinkModal
        url={shareModal.url}
        open={shareModal.open}
        onClose={() => setShareModal({ open: false, url: '' })}
      />
    </div>
  );
}
