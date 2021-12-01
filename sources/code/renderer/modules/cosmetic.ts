/*
 * Cosmetic.ts – Website improvements for better integration within client
 */

import { ipcRenderer } from 'electron';
import { wLog } from '../../global';
import { compare } from 'semver';
/**
 * Gets list of the elements with `tagName` tag name that has any class assigned
 * which its name includes the `searchString`. This tries to replicate the
 * similar behaviour as the one achieved by the `.getElementsByClassName`
 * method, except it can allow for part of the class names as an input.
 * 
 * This can be extremly useful when trying to tweak the sites whose class names
 * includes some part being randomly generated for each build/version.
 */

function findClass<T extends keyof HTMLElementTagNameMap>(searchString: string, tagName: T) {
  const searchResult = new Set<string>();
  for (const container of document.getElementsByTagName<T>(tagName))
    for (const classString of container.classList)
      if(classString.includes(searchString))
        searchResult.add(classString);
  return [...searchResult];
}

export default function preloadCosmetic(): void {
  // Exit if not Discord domain
  if(window.location.origin !== 'https://discord.com') return;
  /*
   * Hide orange popup about downloading the application 
   * (Broken since Electron 16)
   */
  if(compare(process.versions.electron, '16.0.0') === -1 && localStorage.getItem('hideNag') !== 'true')
    localStorage.setItem('hideNag', 'true');
  const removeUnneded = () => {
    // If user is at login/register website, do not apply any cosmetic changes
    if (document.URL.includes('login') || document.URL.includes('register')) {
      return;
    }
    // Get array of `div` elements
    const sideBarClassList = [findClass('listItem-', 'div'), findClass('scroller-', 'div')]

    if (sideBarClassList[0].length === 1) {
      ipcRenderer.send('cosmetic.hideElementByClass', 'div.'+sideBarClassList[1][0]+' > div.'+sideBarClassList[0][0])
      ipcRenderer.once('cosmetic.hideElementByClass', () => wLog("Successfully removed unnecesarry elements on website."));
      ipcRenderer.removeListener('webContents.did-stop-loading', removeUnneded)
    } else {
      console.dir(sideBarClassList)
      wLog("COSMETIC: Couldn't find elements to remove, retrying on next event.");
    }
  };
  ipcRenderer.on("webContents.did-stop-loading", removeUnneded);
  window.addEventListener("load", () => ipcRenderer.send("cosmetic.load"), {once: true})
}