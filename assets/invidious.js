let nextPageToken = null;
let searchQuery = '';
let isSearch = false;
const regionCodes = ['IN'];
let currentRegionIndex = 0;

const invidiousInstance = 'https://invidious.fdn.fr';

const loadClient = async () => {
  const videoId = new URLSearchParams(window.location.search).get('video');
  if (videoId) return displaySingleVideo(videoId);

  searchQuery = new URLSearchParams(window.location.search).get('search') || '';
  if (searchQuery) document.getElementById('searchInput').value = searchQuery;
  isSearch = !!searchQuery;

  await fetchVideos(true); // Fetch initial set of videos
};

const fetchVideos = async (clearPreviousResults = false) => {
  const options = {
    ...(isSearch ? { q: searchQuery } : { chart: 'mostPopular', regionCode: regionCodes[currentRegionIndex] })
  };

  if (clearPreviousResults) document.getElementById('videoContainer').innerHTML = '';

  try {
    const response = await fetch(`${invidiousInstance}/api/v1/${isSearch ? 'search' : 'trending'}?${new URLSearchParams(options)}`);
    const data = await response.json();
    const items = data.items || data;

    await displayVideos(items.slice(0, 40)); // Display the current page of videos

    if (!isSearch) currentRegionIndex = (currentRegionIndex + 1) % regionCodes.length;
  } catch (err) {
    showAlert('Error fetching videos', err.message);
  }
};

const displayVideos = async (videos) => {
  const videoContainer = document.getElementById('videoContainer');
  const videoFetches = videos.map(async video => {
    try {
      const channelLogo = await fetchChannelLogo(video.authorId);

      const videoElement = document.createElement('div');
      videoElement.className = 'w-full overflow-hidden select-none m-0';
      videoElement.innerHTML = `
        <a data-fancybox data-type="iframe" data-src="http://www.youtube.com/embed/${video.videoId}?yt:stretch=16:9&vq=hd480p&autoplay=1&loop=0&color=white&iv_load_policy=3&rel=0&showinfo=0&autohide=0&controls=1&modestbranding=1" href="javascript:;" class="block">
          <img src="${video.videoThumbnails[3].url}" alt="" class="w-full h-48 object-cover">
        </a>
        <div class="p-4">
          <div class="flex items-center space-x-4 mb-0">
            <img src="${channelLogo}" alt="" class="h-10 w-10 rounded-full">
            <div class="flex-1 min-w-0">
              <h3 class="text-md font-semibold line-clamp-2">${video.title}</h3>
              <div class="text-gray-400 text-sm flex items-center space-x-2 whitespace-nowrap overflow-hidden">
                <span>${video.author}</span>
                <span>•</span>
                <span>${new Date(video.published).toDateString()}</span>
              </div>
              <a href="${invidiousInstance}/latest_version?id=${video.videoId}" class="text-blue-500 hover:underline" download>Download</a>
            </div>
          </div>
        </div>
      `;
      videoContainer.appendChild(videoElement);
      videoElement.querySelector('a').addEventListener('click', () => {
        displaySingleVideo(video.videoId);
        saveRecentVideos(video.videoId); // Ensure this is needed
      });
    } catch (err) {
      console.error('Error displaying video', err);
    }
  });

  await Promise.all(videoFetches);

  Fancybox.bind("[data-fancybox]", {
    Toolbar: { display: [{ id: "counter", position: "center" }, "zoom", "fullscreen", "close"] },
    Iframe: { css: { width: '100%', height: '100%' }, attr: { allowfullscreen: "true" } },
    touch: false,
    clickContent: false,
    clickSlide: false
  });
};

const displaySingleVideo = async (videoId) => {
  const singleVideoContainer = document.getElementById('singleVideoContainer');

  singleVideoContainer.innerHTML = '';
  singleVideoContainer.style.display = 'block';
  document.getElementById('loadMoreIndicator').style.display = 'none';

  try {
    const response = await fetch(`${invidiousInstance}/api/v1/videos/${videoId}`);
    const video = await response.json();
    const channelLogo = await fetchChannelLogo(video.authorId);

    singleVideoContainer.innerHTML = `
      <a data-fancybox data-type="iframe" data-src="${invidiousInstance}/embed/${video.videoId}?fs=1" href="javascript:;" class="block">
        <img src="${video.videoThumbnails[3].url}" alt="${video.title}" class="w-full h-48 object-cover">
      </a>
      <div class="p-4">
        <div class="flex items-center space-x-4 mb-4">
          <img src="${channelLogo}" alt="" class="h-10 w-10 rounded-full">
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold line-clamp-2">${video.title}</h3>
            <div class="text-gray-400 text-sm flex items-center space-x-2 whitespace-nowrap overflow-hidden">
              <span>${video.author}</span>
              <span>•</span>
              <span>${new Date(video.published).toDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    Fancybox.bind("[data-fancybox]", {
      Toolbar: { display: [{ id: "counter", position: "center" }, "zoom", "fullscreen", "close"] },
      Iframe: { css: { width: '100%', height: '100%' }, attr: { allowfullscreen: "true" } },
      touch: false,
      clickContent: false,
      clickSlide: false
    });
  } catch (err) {
    showAlert('Error fetching video:', err.message);
  }
};

const fetchChannelLogo = async (channelId) => {
  try {
    console.log(`Fetching channel logo for ${channelId}`);
    const response = await fetch(`${invidiousInstance}/api/v1/channels/${channelId}`);
    const channel = await response.json();
    console.log(`Channel response:`, channel);
    if (channel.authorThumbnails && channel.authorThumbnails.length > 0) {
      return channel.authorThumbnails[0].url;
    } else {
      console.error(`No author thumbnails found for channel ${channelId}`);
      return ''; // Return a fallback image URL or empty string
    }
  } catch (err) {
    console.error('Error fetching channel logo', err);
    return ''; // Return a fallback image URL or empty string
  }
};

const showAlert = (message, reason) => {
  const alertContainer = document.createElement('div');
  alertContainer.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg';
  alertContainer.innerHTML = `
    <div class="flex items-center space-x-2">
      <span class="font-bold">${message}</span>
      <span class="text-sm">${reason ? reason : ''}</span>
    </div>
  `;
  document.body.appendChild(alertContainer);
  setTimeout(() => {
    alertContainer.remove();
  }, 10000);
};

// Optional: Function to save recent videos (if needed)
const saveRecentVideos = async (videoId) => {
  try {
    await fetch('/api/saveRecentVideos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    });
  } catch (err) {
    console.error('Error saving recent videos:', err);
  }
};

// Event listener for search input
document.getElementById('searchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchQuery = e.target.value;
    isSearch = true;
    fetchVideos(true); // Fetch videos based on search query
  }
});

loadClient(); // Initial client load
