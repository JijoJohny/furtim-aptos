import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign, FileText, Target, Sparkles } from 'lucide-react';
import './CreateLinkModal.css';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLink: (linkData: LinkData) => void;
}

interface LinkData {
  name: string;
  slug: string;
  linkType: 'simple' | 'download' | '';
  amountType: 'fixed' | 'open' | '';
  fixedAmount?: number;
  description?: string;
}

const CreateLinkModal: React.FC<CreateLinkModalProps> = ({ isOpen, onClose, onCreateLink }) => {
  const [formData, setFormData] = useState<LinkData>({
    name: '',
    slug: '',
    linkType: '',
    amountType: '',
    fixedAmount: undefined,
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  // Validate form
  useEffect(() => {
    const validateForm = () => {
      const newErrors: Record<string, string> = {};
      
      if (!formData.slug.trim()) {
        newErrors.slug = 'Link name is required';
      } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        newErrors.slug = 'Use lowercase letters, numbers, and hyphens only';
      }
      
      if (!formData.linkType) {
        newErrors.linkType = 'Please select a link type';
      }
      
      if (!formData.amountType) {
        newErrors.amountType = 'Please select an amount type';
      }
      
      if (formData.amountType === 'fixed' && (!formData.fixedAmount || formData.fixedAmount <= 0)) {
        newErrors.fixedAmount = 'Please enter a valid amount';
      }
      
      setErrors(newErrors);
      setIsValid(Object.keys(newErrors).length === 0);
    };

    validateForm();
  }, [formData]);

  const handleInputChange = (field: keyof LinkData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value.toString().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleCardSelect = (type: 'linkType' | 'amountType', value: string) => {
    setFormData(prev => ({ ...prev, [type]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onCreateLink(formData);
      onClose();
    }
  };

  const linkTypeOptions = [
    {
      id: 'simple',
      title: 'Simple Payment',
      description: 'Basic payment link with optional fixed amount',
      icon: DollarSign
    },
    {
      id: 'download',
      title: 'Digital Download',
      description: 'Deliver files automatically after payment',
      icon: FileText
    }
  ];

  const amountTypeOptions = [
    {
      id: 'fixed',
      title: '🎯 Fixed Amount',
      description: 'Set a specific USDC amount to receive',
      icon: Target
    },
    {
      id: 'open',
      title: '✨ Open Amount',
      description: 'Let the payer decide the USDC amount',
      icon: Sparkles
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Link Name & Style</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Link Name Input */}
          <div className="form-group">
            <label htmlFor="link-name" className="form-label">
              Link Name
            </label>
            <input
              id="link-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., design-project"
              className={`form-input ${errors.name ? 'error' : ''}`}
              autoFocus
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
            <div className="form-helper">
              Your link will be: furtim.me/{formData.slug || 'your-link'}
            </div>
          </div>

          {/* Link Type Selection */}
          <div className="form-group">
            <label className="form-label">Link Type</label>
            <div className="card-grid">
              {linkTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`card-option ${formData.linkType === option.id ? 'selected' : ''}`}
                    onClick={() => handleCardSelect('linkType', option.id)}
                  >
                    <div className="card-content">
                      <Icon size={20} className="card-icon" />
                      <h3 className="card-title">{option.title}</h3>
                      <p className="card-description">{option.description}</p>
                    </div>
                    {formData.linkType === option.id && (
                      <div className="card-check">
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {errors.linkType && <span className="error-text">{errors.linkType}</span>}
          </div>

          {/* Amount Type Selection */}
          <div className="form-group">
            <label className="form-label">Amount</label>
            <div className="card-grid">
              {amountTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`card-option ${formData.amountType === option.id ? 'selected' : ''}`}
                    onClick={() => handleCardSelect('amountType', option.id)}
                  >
                    <div className="card-content">
                      <Icon size={20} className="card-icon" />
                      <h3 className="card-title">{option.title}</h3>
                      <p className="card-description">{option.description}</p>
                    </div>
                    {formData.amountType === option.id && (
                      <div className="card-check">
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {errors.amountType && <span className="error-text">{errors.amountType}</span>}
          </div>

          {/* Fixed Amount Input */}
          {formData.amountType === 'fixed' && (
            <div className="form-group">
              <label htmlFor="fixed-amount" className="form-label">
                Amount (USDC)
              </label>
              <div className="amount-input-container">
                <input
                  id="fixed-amount"
                  type="number"
                  value={formData.fixedAmount || ''}
                  onChange={(e) => handleInputChange('fixedAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className={`form-input amount-input ${errors.fixedAmount ? 'error' : ''}`}
                />
                <div className="currency-badge">
                  <span className="currency-symbol">$</span>
                  <span className="currency-text">USDC</span>
                </div>
              </div>
              {errors.fixedAmount && <span className="error-text">{errors.fixedAmount}</span>}
              <div className="form-helper">
                Enter the amount in USDC you want to receive
              </div>
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add a description for your payment link..."
              className="form-textarea"
              rows={3}
            />
          </div>

          {/* Playful Hint */}
          <div className="form-hint">
            <Sparkles size={16} />
            <span>Wanna spice up your link? Add some Indonesian creative flair…</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`submit-button ${isValid ? 'enabled' : 'disabled'}`}
            disabled={!isValid}
            aria-disabled={!isValid}
          >
            Create payment link
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateLinkModal;
