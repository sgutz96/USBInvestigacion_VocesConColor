document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-button');
  const mapContents = document.querySelectorAll('.map-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-map');

      // Remove active states
      tabs.forEach(t => t.classList.remove('active'));
      mapContents.forEach(mc => mc.classList.remove('active'));

      // Add active to selected tab and map
      tab.classList.add('active');
      const targetMap = document.getElementById(targetId);
      targetMap.classList.add('active');

      // Lazy-load iframe if not loaded
      if (!targetMap.querySelector('iframe')) {
        const src = targetMap.getAttribute('data-src');
        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = tab.textContent.trim();
        iframe.loading = 'lazy';
        targetMap.appendChild(iframe);
      }
    });
  });

  // Auto-load the first iframe on page load
  const firstMap = document.querySelector('.map-content.active');
  if (firstMap && !firstMap.querySelector('iframe')) {
    const src = firstMap.getAttribute('data-src');
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = "Mapa inicial";
    iframe.loading = 'lazy';
    firstMap.appendChild(iframe);
  }
});
