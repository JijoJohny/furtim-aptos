import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Copy, QrCode, Edit3, Check } from 'lucide-react';
import Dashboard from './Dashboard';
import BottomNavigation from './BottomNavigation';
import './LinksPage.css';

interface PaymentLink {
  id: string;
  title: string;
  slug: string;
  amountType: 'fixed' | 'open';
  fixedAmount?: number;
  description?: string;
  createdAt: string;
  isNew?: boolean;
}

interface LinksPageProps {
  username: string;
  walletAddress: string;
  newLink?: PaymentLink;
  onCreateLink: () => void;
  onTabChange?: (tab: 'home' | 'links' | 'create') => void;
}

const LinksPage: React.FC<LinksPageProps> = ({ username, walletAddress, newLink, onCreateLink, onTabChange }) => {
  const [links, setLinks] = useState<PaymentLink[]>([
    // Sample data - in a real app, this would come from an API
    {
      id: '1',
      title: 'Design Project',
      slug: 'design-project',
      amountType: 'fixed',
      fixedAmount: 125,
      description: 'Logo design and branding package',
      createdAt: '2024-01-15',
      isNew: false
    },
    {
      id: '2',
      title: 'Consulting Session',
      slug: 'consulting-session',
      amountType: 'open',
      description: '1-hour strategy consultation',
      createdAt: '2024-01-10',
      isNew: false
    }
  ]);

  const [showToast, setShowToast] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Add new link if provided
  useEffect(() => {
    if (newLink) {
      setLinks(prev => [newLink, ...prev]);
      setShowToast(true);
      
      // Auto-hide toast after 2.5s
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [newLink]);

  const handleCopyLink = async (link: PaymentLink) => {
    const fullUrl = `https://furtim.me/${link.slug}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLinkId(link.id);
      
      // Reset copied state after 2s
      setTimeout(() => {
        setCopiedLinkId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleQRCode = (link: PaymentLink) => {
    // In a real app, this would open a QR code modal or page
    console.log('Generate QR code for:', link.slug);
  };

  const handleEditLink = (link: PaymentLink) => {
    // In a real app, this would open an edit modal
    console.log('Edit link:', link.slug);
  };

  const getAmountText = (link: PaymentLink) => {
    if (link.amountType === 'fixed') {
      return `Fixed Amount • ${link.fixedAmount} USDC`;
    }
    return 'Open Amount';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="links-page-container">
      {/* Header */}
      <Dashboard 
        onClose={() => {}}
        showCloseButton={false}
        isWalletConnected={true}
        walletAddress={walletAddress}
      />

      {/* Main Content */}
      <div className="links-page-main">
        {/* Page Header */}
        <div className="links-page-header">
          <h1 className="links-page-title">Payment Links</h1>
          <p className="links-page-subtitle">
            Share these links to receive payments securely and privately
          </p>
        </div>

        {/* Links Grid */}
        <div className="links-grid">
          {links.map((link, index) => (
            <div 
              key={link.id}
              className={`link-card ${link.isNew ? 'new-link' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="link-card-header">
                <div className="link-icon">
                  <LinkIcon size={20} />
                </div>
                <div className="link-info">
                  <h3 className="link-title">{link.title}</h3>
                  <p className="link-subtitle">{getAmountText(link)}</p>
                </div>
              </div>

              <div className="link-url-container">
                <div className="link-url">
                  <span className="url-text">furtim.me/{link.slug}</span>
                  <div className="url-actions">
                    <button 
                      className="url-action-button"
                      onClick={() => handleCopyLink(link)}
                      aria-label={`Copy link for ${link.title}`}
                    >
                      {copiedLinkId === link.id ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    <button 
                      className="url-action-button"
                      onClick={() => handleQRCode(link)}
                      aria-label={`Generate QR code for ${link.title}`}
                    >
                      <QrCode size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="link-card-footer">
                <div className="link-meta">
                  <span className="link-date">Created {formatDate(link.createdAt)}</span>
                </div>
                <button 
                  className="edit-button"
                  onClick={() => handleEditLink(link)}
                  aria-label={`Edit ${link.title}`}
                >
                  <Edit3 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {links.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <LinkIcon size={48} />
            </div>
            <h3 className="empty-state-title">No payment links yet</h3>
            <p className="empty-state-description">
              Create your first payment link to start receiving payments
            </p>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="success-toast">
          <Check size={16} />
          <span>Link created — copied to clipboard</span>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed-bottom-navigation">
        <BottomNavigation 
          activeTab="links" 
          onCreateLink={onCreateLink}
          onTabChange={onTabChange}
        />
      </div>
    </div>
  );
};

export default LinksPage;
