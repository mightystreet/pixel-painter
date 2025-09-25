import React, { useState, useEffect } from 'react';

/**
 * Modular Side Panel Component
 * Responsive sidebar that adapts to screen size and can contain various modules
 * 
 * @param {string} position - Either "left" or "right" for sidebar placement
 * @param {Array} modules - Array of module objects to render in the sidebar
 * @param {boolean} collapsible - Whether the sidebar can be collapsed on smaller screens
 */
export default function Side({ position, modules = [], collapsible = true }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');

  // Monitor screen size for responsive behavior
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setScreenSize('mobile');
      } else if (width <= 767) {
        setScreenSize('tablet-portrait');
      } else if (width <= 1023) {
        setScreenSize('tablet-landscape');
      } else if (width <= 1400) {
        setScreenSize('desktop');
      } else {
        setScreenSize('large-desktop');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Default modules if none provided
  const defaultModules = [
    {
      id: 'info',
      title: `${position === 'left' ? 'Left' : 'Right'} Panel`,
      type: 'info',
      content: {
        text: `This is the ${position} sidebar panel. It's responsive and modular!`,
        icon: position === 'left' ? '📱' : '🎨'
      }
    },
    {
      id: 'stats',
      title: 'Screen Info',
      type: 'stats',
      content: {
        items: [
          { label: 'Screen Size', value: screenSize },
          { label: 'Position', value: position },
          { label: 'Collapsed', value: isCollapsed ? 'Yes' : 'No' }
        ]
      }
    }
  ];

  const activeModules = modules.length > 0 ? modules : defaultModules;

  /**
   * Render different module types
   */
  const renderModule = (module) => {
    switch (module.type) {
      case 'info':
        return (
          <div key={module.id} className="side-module info-module">
            <div className="module-header">
              <span className="module-icon">{module.content.icon}</span>
              <h3 className="module-title">{module.title}</h3>
            </div>
            <p className="module-text">{module.content.text}</p>
          </div>
        );

      case 'stats':
        return (
          <div key={module.id} className="side-module stats-module">
            <h3 className="module-title">{module.title}</h3>
            <div className="stats-list">
              {module.content.items.map((item, index) => (
                <div key={index} className="stat-item">
                  <span className="stat-label">{item.label}:</span>
                  <span className="stat-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tools':
        return (
          <div key={module.id} className="side-module tools-module">
            <h3 className="module-title">{module.title}</h3>
            <div className="tools-grid">
              {module.content.tools.map((tool, index) => (
                <button 
                  key={index} 
                  className="tool-button"
                  onClick={tool.action}
                  title={tool.tooltip}
                >
                  <span className="tool-icon">{tool.icon}</span>
                  <span className="tool-label">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'custom':
        return (
          <div key={module.id} className="side-module custom-module">
            {module.title && <h3 className="module-title">{module.title}</h3>}
            <div className="custom-content">
              {module.content.render ? module.content.render() : module.content}
            </div>
          </div>
        );

      default:
        return (
          <div key={module.id} className="side-module default-module">
            <h3 className="module-title">{module.title}</h3>
            <div>{JSON.stringify(module.content)}</div>
          </div>
        );
    }
  };

  return (
    <aside className={`side-area side-area-${position} ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse toggle for smaller screens */}
      {collapsible && ['tablet-portrait', 'mobile'].includes(screenSize) && (
        <button 
          className="collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${position} panel`}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      )}

      {/* Panel content */}
      <div className={`side-panel-content ${isCollapsed ? 'hidden' : ''}`}>
        {activeModules.map(renderModule)}
      </div>

      {/* Responsive indicator */}
      <div className="panel-footer">
        <small className="screen-indicator">{screenSize}</small>
      </div>
    </aside>
  );
}
