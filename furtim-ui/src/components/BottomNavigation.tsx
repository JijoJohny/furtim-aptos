import React from 'react';
import { Home, Link as LinkIcon, Plus } from 'lucide-react';
import './BottomNavigation.css';

interface BottomNavigationProps {
  activeTab?: 'home' | 'links' | 'create';
  onTabChange?: (tab: 'home' | 'links' | 'create') => void;
  onCreateLink?: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeTab = 'home',
  onTabChange,
  onCreateLink
}) => {
  const handleTabClick = (tab: 'home' | 'links' | 'create') => {
    if (tab === 'create' && onCreateLink) {
      onCreateLink();
    } else if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="bottom-navigation-container">
      <div className="bottom-navigation-box">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => handleTabClick('home')}
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'links' ? 'active' : ''}`}
          onClick={() => handleTabClick('links')}
        >
          <LinkIcon size={20} />
          <span>Links</span>
        </button>
        
        <button 
          className={`nav-item create ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => handleTabClick('create')}
        >
          <Plus size={20} />
          <span>Create Link</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
