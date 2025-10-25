// Color theme management module

const colorThemes = {
    'corporate-blue': {
        name: 'Corporate Blue',
        description: 'Professional and trustworthy',
        colorPrimary: '#1C2833',
        colorSecondary: '#2E4053',
        colorAccent: '#3498DB',
        colorBackground: '#FFFFFF',
        colorText: '#1d1d1d',
        category: ['business', 'corporate', 'finance']
    },
    'vibrant-purple': {
        name: 'Vibrant Purple',
        description: 'Creative and innovative',
        colorPrimary: '#667eea',
        colorSecondary: '#764ba2',
        colorAccent: '#F39C12',
        colorBackground: '#FFFFFF',
        colorText: '#1d1d1d',
        category: ['tech', 'creative', 'marketing']
    },
    'forest-green': {
        name: 'Forest Green',
        description: 'Sustainable and growth-focused',
        colorPrimary: '#1E5631',
        colorSecondary: '#2D7F4B',
        colorAccent: '#82C341',
        colorBackground: '#FFFFFF',
        colorText: '#1d1d1d',
        category: ['environment', 'health', 'sustainability']
    },
    'ocean-teal': {
        name: 'Ocean Teal',
        description: 'Modern and fresh',
        colorPrimary: '#006B7D',
        colorSecondary: '#00A1B3',
        colorAccent: '#FF6B6B',
        colorBackground: '#FFFFFF',
        colorText: '#1d1d1d',
        category: ['tech', 'healthcare', 'education']
    },
    'sunset-orange': {
        name: 'Sunset Orange',
        description: 'Energetic and dynamic',
        colorPrimary: '#D64933',
        colorSecondary: '#E67E50',
        colorAccent: '#FFA826',
        colorBackground: '#FFFFFF',
        colorText: '#1d1d1d',
        category: ['marketing', 'retail', 'creative']
    },
    'royal-burgundy': {
        name: 'Royal Burgundy',
        description: 'Elegant and sophisticated',
        colorPrimary: '#6B2737',
        colorSecondary: '#8B3A52',
        colorAccent: '#C89B3C',
        colorBackground: '#FFFFFF',
        colorText: '#1d1d1d',
        category: ['luxury', 'finance', 'executive']
    },
    'midnight-navy': {
        name: 'Midnight Navy',
        description: 'Authoritative and confident',
        colorPrimary: '#1A2332',
        colorSecondary: '#2C3E50',
        colorAccent: '#E74C3C',
        colorBackground: '#FFFFFF',
        colorText: '#1d1d1d',
        category: ['business', 'consulting', 'corporate']
    },
    'sage-olive': {
        name: 'Sage Olive',
        description: 'Calm and balanced',
        colorPrimary: '#4A5D4F',
        colorSecondary: '#6B8E73',
        colorAccent: '#D4A574',
        colorBackground: '#FFFFFF',
        colorText: '#1d1d1d',
        category: ['wellness', 'education', 'nonprofit']
    }
};

let selectedTheme = null;

function displayThemeSelector(suggestedThemeKey) {
    const themeGrid = document.getElementById('themeGrid');
    const themeSelector = document.getElementById('themeSelector');
    const suggestedBadge = document.getElementById('suggestedBadge');
    
    if (!themeGrid || !colorThemes) return; // Guard clause
    
    themeGrid.innerHTML = '';
    themeSelector.style.display = 'block';
    
    // Show AI suggestion badge only if AI has made a suggestion
    if (suggestedThemeKey && colorThemes[suggestedThemeKey]) {
        suggestedBadge.textContent = `✨ ${colorThemes[suggestedThemeKey].name} Suggested`;
        suggestedBadge.style.display = 'inline-block';
    } else {
        suggestedBadge.style.display = 'none';
    }
    
    Object.keys(colorThemes).forEach(themeKey => {
        const theme = colorThemes[themeKey];
        if (!theme) return; // Skip if theme is undefined
        
        const isSuggested = themeKey === suggestedThemeKey;
        const currentSelectedTheme = window.selectedTheme || selectedTheme;
        const isSelected = currentSelectedTheme === themeKey || (!currentSelectedTheme && isSuggested);
        const isExtracted = theme.isExtracted || false;
        
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.style.cssText = `
            border: 2px solid ${isSelected ? theme.colorAccent : '#e0e7ff'};
            border-radius: 8px;
            padding: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;
            background: ${isSelected ? theme.colorPrimary + '10' : 'white'};
            position: relative;
        `;
        
        card.innerHTML = `
            ${isExtracted ? '<div style="position: absolute; top: 0.25rem; right: 0.25rem; background: #667eea; color: white; padding: 0.15rem 0.4rem; border-radius: 8px; font-size: 0.65rem; font-weight: 600;">📁 From Files</div>' : (isSuggested && !selectedTheme ? '<div style="position: absolute; top: 0.25rem; right: 0.25rem; background: #82C341; color: white; padding: 0.15rem 0.4rem; border-radius: 8px; font-size: 0.65rem; font-weight: 600;">✨ Suggested</div>' : '')}
            <div style="display: flex; gap: 0.25rem; margin-bottom: 0.5rem;">
                <div style="flex: 1; height: 30px; background: ${theme.colorPrimary}; border-radius: 4px;"></div>
                <div style="flex: 1; height: 30px; background: ${theme.colorSecondary}; border-radius: 4px;"></div>
                <div style="flex: 1; height: 30px; background: ${theme.colorAccent}; border-radius: 4px;"></div>
            </div>
            <div style="font-weight: 600; font-size: 0.85rem; color: #333; margin-bottom: 0.25rem;">${theme.name}</div>
            <div style="font-size: 0.7rem; color: #666;">${theme.description}</div>
            ${isSelected ? '<div style="margin-top: 0.5rem; text-align: center; color: ' + theme.colorPrimary + '; font-size: 0.75rem; font-weight: 600;">✓ Selected</div>' : ''}
        `;
        
        card.onclick = () => selectTheme(themeKey);
        themeGrid.appendChild(card);
    });
}

function selectTheme(themeKey) {
    // Validate theme exists
    if (!colorThemes || !colorThemes[themeKey]) {
        console.error('Invalid theme key:', themeKey);
        return;
    }
    
    selectedTheme = themeKey;
    window.selectedTheme = themeKey;
    
    // Save to localStorage
    localStorage.setItem('selected_theme', themeKey);
    
    const theme = colorThemes[themeKey];
    
    if (window.currentSlideData) {
        window.currentSlideData.designTheme = {
            ...theme,
            name: theme.name,
            description: theme.description
        };
        
        const suggestedTheme = window.currentSlideData.suggestedTheme || null;
        displayThemeSelector(suggestedTheme);
        
        if (window.displayPreview) {
            window.displayPreview(window.currentSlideData);
        }
        
        if (window.showStatus) {
            window.showStatus(`✨ Theme changed to ${theme.name}. Click "Generate PowerPoint" to create with new colors.`, 'success');
        }
    } else {
        // No slide data yet, just update the visual selection
        const suggestedTheme = null;
        displayThemeSelector(suggestedTheme);
        
        if (window.showStatus) {
            window.showStatus(`✨ ${theme.name} selected. This will be used when you generate your slides.`, 'success');
        }
    }
}

// Export for global access
window.colorThemes = colorThemes;
window.selectedTheme = selectedTheme;
window.displayThemeSelector = displayThemeSelector;
window.selectTheme = selectTheme;

