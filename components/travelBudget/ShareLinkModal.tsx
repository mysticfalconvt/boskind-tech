import React, { useState } from 'react';

interface ShareLinkModalProps {
  url: string;
  open: boolean;
  onClose: () => void;
}

const LENGTH_WARN_THRESHOLD = 6000;

const ShareLinkModal: React.FC<ShareLinkModalProps> = ({ url, open, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Clipboard write failed:', error);
    }
  };

  const isLong = url.length > LENGTH_WARN_THRESHOLD;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg">Share this budget</h3>
        <p className="py-2 text-sm text-base-content/70">
          Anyone with this link can view (and load) the current options.
        </p>

        <div className="form-control">
          <textarea
            readOnly
            className="textarea textarea-bordered text-xs font-mono"
            rows={4}
            value={url}
            onFocus={(e) => e.currentTarget.select()}
          />
          <label className="label">
            <span className="label-text-alt text-base-content/60">
              {url.length.toLocaleString()} characters
            </span>
            {isLong && (
              <span className="label-text-alt text-warning">
                Long URL — may be truncated by some chat tools
              </span>
            )}
          </label>
        </div>

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareLinkModal;
