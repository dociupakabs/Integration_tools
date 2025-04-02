import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const CopyButton = ({ text, className = "absolute top-4 right-4" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`${className} p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors`}
      title="Kopiuj do schowka"
    >
      {copied ? (
        <Check className="w-5 h-5 text-green-500" />
      ) : (
        <Copy className="w-5 h-5" />
      )}
    </button>
  );
};

export default CopyButton;