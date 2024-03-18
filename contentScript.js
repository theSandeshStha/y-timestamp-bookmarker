let youtubeLeftControls, youtubePlayer;
let currentVideo = "";
let currentVideoBookmarks = [];

const fetchBookmarks = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([currentVideo], (obj) => {
      resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
    });
  });
};

const addNewBookmarkEventHandler = async () => {
  const currentTime = youtubePlayer.currentTime;

  // Check if currentTime is a valid number
  if (!isNaN(currentTime) && currentTime >= 0) {
    const newBookmark = {
      time: currentTime,
      desc: "Bookmark at " + getTime(currentTime),
    };

    currentVideoBookmarks = await fetchBookmarks();

    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(
        [...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)
      ),
    });
  } else {
    console.error("Invalid time value:", currentTime);
  }
};

const newVideoLoaded = async () => {
  const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];

  currentVideoBookmarks = await fetchBookmarks();

  if (!bookmarkBtnExists) {
    const bookmarkBtn = document.createElement("img");

    bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
    bookmarkBtn.className = "ytp-button " + "bookmark-btn";
    bookmarkBtn.title = "Click to bookmark current timestamp";
    bookmarkBtn.style.height = 1;
    bookmarkBtn.style.width = 1;

    youtubeLeftControls =
      document.getElementsByClassName("ytp-left-controls")[0];
    youtubePlayer = document.getElementsByClassName("video-stream")[0];

    youtubeLeftControls.appendChild(bookmarkBtn);
    bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
  }
};

chrome.runtime.onMessage.addListener((obj, sender, response) => {
  const { type, value, videoId } = obj;

  if (type === "NEW") {
    currentVideo = videoId;
    newVideoLoaded();
  } else if (type === "PLAY") {
    // Ensure value is a valid number before setting currentTime
    if (!isNaN(value) && value >= 0) {
      youtubePlayer.currentTime = value;
    } else {
      console.error("Invalid time value:", value);
    }
  } else if (type === "DELETE") {
    currentVideoBookmarks = currentVideoBookmarks.filter(
      (b) => b.time != value
    );
    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(currentVideoBookmarks),
    });

    response(currentVideoBookmarks);
  }
});

newVideoLoaded();

const getTime = (t) => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substr(11, 8);
};
