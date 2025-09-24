import React, { useState } from 'react';
import { Copy, ExternalLink, Link as LinkIcon, Zap, Folder, ArrowDown, ArrowUp, Sparkles } from 'lucide-react';
import Dashboard from './Dashboard';
import BottomNavigation from './BottomNavigation';
import CreateLinkModal from './CreateLinkModal';
import './HomeDashboard.css';

interface HomeDashboardProps {
  username: string;
  walletAddress: string;
  onCreateLink?: (linkData: any) => void;
  onTabChange?: (tab: 'home' | 'links' | 'create') => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ username, walletAddress, onCreateLink, onTabChange }) => {
  const [activeReceiveTab, setActiveReceiveTab] = useState<'link' | 'quick'>('link');
  const [activeActivityFilter, setActiveActivityFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCopyLink = () => {
    const link = `furtim.me/${username}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  const handleOpenLink = () => {
    const link = `https://furtim.me/${username}`;
    window.open(link, '_blank');
  };

  const handleCreateLink = () => {
    setShowCreateModal(true);
  };

  const handleCreateLinkSubmit = (linkData: any) => {
    console.log('Creating link:', linkData);
    if (onCreateLink) {
      onCreateLink(linkData);
    }
    setShowCreateModal(false);
  };

  return (
    <div className="home-dashboard-container">
      {/* Header */}
      <Dashboard 
        onClose={() => {}}
        showCloseButton={false}
        isWalletConnected={true}
        walletAddress={walletAddress}
      />

      {/* Main Content */}
      <div className="home-dashboard-main">
        {/* Stealth Balances Section */}
        <div className="stealth-balances-section">
          <div className="stealth-balances-card">
            <h2 className="stealth-balances-title">Stealth Balances</h2>
            <div className="stealth-balances-amount">$0.00 USD</div>
            <p className="stealth-balances-description">Private payments received through FURTIM</p>
            
            <div className="empty-state">
              <div className="empty-state-icon">
                <div className="gift-icon">🎁</div>
              </div>
              <div className="empty-state-text">
                <h3>No stealth balances yet</h3>
                <p>This shows tokens you've received through FURTIM's stealth payments, not your regular wallet balance.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Receive Section */}
        <div className="receive-section">
          <h2 className="section-title">Receive</h2>
          <div className="receive-card">
            <div className="receive-tabs">
              <button 
                className={`receive-tab ${activeReceiveTab === 'link' ? 'active' : ''}`}
                onClick={() => setActiveReceiveTab('link')}
              >
                <LinkIcon size={16} />
                Link
              </button>
              <button 
                className={`receive-tab ${activeReceiveTab === 'quick' ? 'active' : ''}`}
                onClick={() => setActiveReceiveTab('quick')}
              >
                <Zap size={16} />
                Quick
              </button>
            </div>

            <div className="username-tag">
              <div className="tag-icon">🏷️</div>
              <span className="tag-text">{username}</span>
              <button className="edit-button">
                <span>✏️</span>
              </button>
            </div>

            <div className="receive-link">
              <span className="link-text">furtim.me/{username}</span>
              <div className="link-actions">
                <button className="action-button" onClick={handleCopyLink}>
                  <Copy size={16} />
                </button>
                <button className="action-button" onClick={handleOpenLink}>
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="activity-section">
          <h2 className="section-title">Activity</h2>
          <div className="activity-card">
            <div className="activity-filters">
              <button 
                className={`activity-filter ${activeActivityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveActivityFilter('all')}
              >
                <Folder size={16} />
                All
              </button>
              <button 
                className={`activity-filter ${activeActivityFilter === 'incoming' ? 'active' : ''}`}
                onClick={() => setActiveActivityFilter('incoming')}
              >
                <ArrowDown size={16} />
                Incoming
              </button>
              <button 
                className={`activity-filter ${activeActivityFilter === 'outgoing' ? 'active' : ''}`}
                onClick={() => setActiveActivityFilter('outgoing')}
              >
                <ArrowUp size={16} />
                Outgoing
              </button>
              <div className="transaction-count">
                0 transactions total
                <Sparkles size={16} />
              </div>
            </div>

            <div className="empty-activity">
              <div className="empty-activity-icon">
                <Sparkles size={48} />
              </div>
              <div className="empty-activity-text">
                <h3>No Transactions Yet</h3>
                <p>Your transaction history will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="fixed-bottom-navigation">
        <BottomNavigation 
          activeTab="home" 
          onCreateLink={handleCreateLink}
          onTabChange={onTabChange}
        />
      </div>

      {/* Create Link Modal */}
      <CreateLinkModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateLink={handleCreateLinkSubmit}
      />
    </div>
  );
};

export default HomeDashboard;
