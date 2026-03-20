import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';

const useAnalytics = (projectName) => {
  const location = useLocation();

  useEffect(() => {
    const trackView = async () => {
      try {
        const fingerPrint = localStorage.getItem('visitor_id') || 
                            Math.random().toString(36).substring(2, 15);
        
        if (!localStorage.getItem('visitor_id')) {
          localStorage.setItem('visitor_id', fingerPrint);
        }

        await supabase.from('analytics_views').insert([{
          project_name: projectName,
          path: location.pathname,
          visitor_id: fingerPrint,
          user_agent: navigator.userAgent,
          referrer: document.referrer
        }]);
      } catch (e) {
        console.warn('Analytics tracking failed', e);
      }
    };

    trackView();
  }, [location.pathname, projectName]);
};

export default useAnalytics;
