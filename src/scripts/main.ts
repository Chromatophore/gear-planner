// import '@webcomponents/webcomponentsjs/webcomponents-bundle.js'
// import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js'

// import {GearSet, XivApiGearInfo} from "./geartypes";

import {GearPlanSheet, NewSheetForm, SheetPickerTable} from "./components";
import {DataManager} from "./datamanager";

// customElements.define("gear-plan-row", GearPlanRow)


export const contentArea = document.getElementById("content-area");
export const topMenuArea = document.getElementById("dev-menu-area");
const editorArea = document.getElementById("editor-area");

async function initialLoad() {
    processHash();
}

let expectedHash = undefined;

function arrayEq(left: any[], right: any[]) {
    if (left === undefined && right === undefined) {
        return true;
    }
    if (left === undefined || right === undefined) {
        return false;
    }
    if (left.length !== right.length) {
        return false;
    }
    for (let i = 0; i < left.length; i++) {
        if (left[i] !== right[i]) {
            return false;
        }
    }
    return true;
}

function processHash() {
    // Remove the literal #
    const hash = (location.hash.startsWith("#") ? location.hash.substring(1) : location.hash).split('/').filter(item => item);
    console.log("processHash", hash);
    if (arrayEq(hash, expectedHash)) {
        console.log("Ignoring internal hash change")
        return;
    }
    expectedHash = hash;
    if (hash.length === 0) {
        console.log("No sheet open");
        showSheetPickerMenu();
    }
    else if (hash.length === 2 && hash[0] === "sheet") {
        const sheetKey = hash[1];
        console.log("Loading: " + sheetKey);
        openSheetByKey(sheetKey);
    }
    else if (hash[0] === "newsheet") {
        showNewSheetForm();
    }
}

export function showNewSheetForm() {
    setHash('newsheet');
    contentArea.replaceChildren(new NewSheetForm(openSheet));
    setEditorAreaContent();
}

function setHash(...hashParts: string[]) {
    for (let hashPart of hashParts) {
        if (hashPart === undefined) {
            console.error(new Error("Undefined url hash part!"), hashParts);
        }
    }
    expectedHash = [...hashParts];
    console.log("New hash parts", hashParts);
    location.hash = '#' + hashParts.map(part => '/' + part).join('');
    console.log(location.hash);
}

export async function openSheetByKey(sheet: string) {
    console.log('openSheetByKey: ', sheet);
    const dataManager = new DataManager();
    const planner = new GearPlanSheet(dataManager, sheet, undefined, setEditorAreaContent);
    await openSheet(planner);
}

export async function openSheet(planner: GearPlanSheet) {
    document['planner'] = planner;
    setHash("sheet", planner.saveKey);
    const loadSheetPromise = planner.loadData().then(() => contentArea.replaceChildren(planner), () => contentArea.replaceChildren(document.createTextNode("Error loading sheet!")));
    await loadSheetPromise;
}

function showSheetPickerMenu() {
    contentArea.replaceChildren(new SheetPickerTable());
    setEditorAreaContent();
}

export function setEditorAreaContent(...nodes: Node[]) {
    if (nodes.length === 0) {
        editorArea.replaceChildren();
        editorArea.style.display = 'none';
    }
    else {
        editorArea.replaceChildren(...nodes);
        editorArea.style.display = 'block';
    }
}

function earlyUiSetup() {
    const devMenu = topMenuArea;
    const header = document.createElement("span")
    header.textContent = "Dev Menu";
    devMenu.appendChild(header);
    const nukeButton = document.createElement("button");
    nukeButton.addEventListener('click', (ev) => {
        localStorage.clear();
        setHash();
        location.reload();
    })
    nukeButton.textContent = "Nuke Local Storage";
    devMenu.appendChild(nukeButton);
}

document.addEventListener("DOMContentLoaded", () => {
    earlyUiSetup();
    addEventListener("hashchange", processHash);
    initialLoad();
})
