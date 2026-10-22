import React, { useEffect, useState } from 'react';
import { BsCheck2, BsClipboard, BsShare } from 'react-icons/bs';
import { encodeShare } from '@/lib/dragonsteel/schedule';

const NAME_KEY = 'dragonsteel-share-name';

type Props = {
  open: boolean;
  starred: Set<number>;
  onClose: () => void;
};

export default function ShareModal({ open, starred, onClose }: Props) {
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) ?? '');
    } catch {
      // storage unavailable; the name just won't be remembered
    }
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const params = new URLSearchParams({ s: encodeShare(starred) });
  if (name.trim()) params.set('n', name.trim());
  const url = `${window.location.origin}${window.location.pathname}?${params}`;

  const updateName = (value: string) => {
    setName(value);
    setCopied(false);
    try {
      localStorage.setItem(NAME_KEY, value);
    } catch {
      // ignore
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard blocked (e.g. non-HTTPS); the link is selectable in the box
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({
        title: 'Dragonsteel Nexus schedule',
        text: `${name.trim() ? `${name.trim()}'s` : 'My'} Dragonsteel Nexus schedule`,
        url,
      });
    } catch {
      // user cancelled
    }
  };

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle" role="dialog" aria-modal="true">
      <div className="modal-box">
        <button
          type="button"
          className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <h3 className="text-lg font-bold">Share your schedule</h3>
        <p className="mt-1 text-sm text-base-content/70">
          Anyone with this link can see your {starred.size} starred{' '}
          {starred.size === 1 ? 'session' : 'sessions'} and add them to their own schedule.
        </p>

        <label className="mt-4 block text-sm font-semibold" htmlFor="share-name">
          Your name <span className="font-normal text-base-content/60">(optional)</span>
        </label>
        <input
          id="share-name"
          type="text"
          className="input input-bordered input-sm mt-1 w-full"
          placeholder="So your friends know whose picks these are"
          value={name}
          onChange={(e) => updateName(e.target.value)}
        />

        <input
          type="text"
          readOnly
          className="input input-bordered input-sm mt-4 w-full font-mono text-xs"
          value={url}
          onFocus={(e) => e.target.select()}
          aria-label="Share link"
        />

        <div className="modal-action">
          {canNativeShare && (
            <button type="button" className="btn" onClick={nativeShare}>
              <BsShare /> Share…
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={copy}>
            {copied ? <BsCheck2 /> : <BsClipboard />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
