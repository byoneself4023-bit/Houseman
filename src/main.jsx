import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// ?mode=homepage 로 접속하면 홈페이지만 풀화면으로 보여줌
const params = new URLSearchParams(window.location.search);
const isHomepageOnly = params.get('mode') === 'homepage';

if (isHomepageOnly) {
  import('./pages/HomepagePage').then(({ HomepagePage }) => {
    const loadLS = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
    const activeVacancies = loadLS("hm_activeVacancies", []);
    const buildingData = loadLS("hm_buildingData", {});
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <HomepagePage activeVacancies={activeVacancies} buildingData={buildingData} />
      </React.StrictMode>
    );
  });
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
