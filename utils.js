export async function getActiveTabURL() {
  let query_options = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(query_options);
  return tab;
}
