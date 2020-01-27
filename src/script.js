const spawn = require('child_process').spawn;
const basename = require('path').basename;
const searchBox = document.getElementById('search');
const directoryButton = document.getElementById('directory');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const {app, dialog, shell} = require('electron').remote;
const os = require('os');
let directory = app.getPath('downloads');

function renderResult(query, path, lines) {
    const filename = basename(path);
    const regex = new RegExp(query, "i");

    return `<div class="result">
        <div class="result-filename" onclick="shell.openItem('${path}')">${filename}</div>
        <div class="result-content">
            ${lines.map(l => {
                const [_, line, content] = l.split(':', 3);
                const highlightContent = content.replace(regex, '<span class="highlight">$&</span>');
                return `<div class="result-line">${line}</div>
                        <div class="result-text">${highlightContent}</div>`
            }).join('')}
        </div>
    </div>`
}

function spawnProcess(query) {
    if (os.platform() == "win32") {
        return spawn("bash", ["-c", `pdfgrep "${query}" -Pinr "${directory}" -m 20`]);
    } else {
        return spawn("pdfgrep", [query, "-Pinr", directory, "-m", "20"]);
    }
}

function search(query) {
    const process = spawnProcess(query);
    console.log(process)
    results.innerHTML = "";
    loading.style.opacity = "1";
    let output = "";
    process.stdout.on("data", data => {
        output += data.toString()
    });
    process.on("exit", () => {
        const outputList = output.split("\n");
        const uniqueList = outputList
            .map(item => item.split(':')[0])
            .filter(a => a !== "")
            .filter((item, i, ar) => ar.indexOf(item) === i)
        loading.style.opacity = "0";
        results.innerHTML = uniqueList.map(filename => renderResult(
            query,
            filename,
            outputList.filter(item => item.split(':')[0] === filename)
        )).join('');
    });
}

function clear() {
    results.innerHTML = "";
}

function doSearch() {
    const query = searchBox.value;
    if (query === "") clear();
    else search(query);
}

searchBox.oninput = doSearch;

directoryButton.onclick = () => {
    const dirs = dialog.showOpenDialog({ 'properties': ['openDirectory'] });
    if (dirs !== undefined && dirs.length > 0) {
        directory = dirs[0];
        searchBox.setAttribute('placeholder', `Search in ${basename(directory)}...`)
        doSearch();
    }

    // dialog.showOpenDialog({ 'properties': ['openDirectory'] })
        // .then(dir => {
            // if (dir !== undefined && dir.filePaths.length > 0) {
                // console.log(dir)
                // directory = dir.filePaths[0]
                // searchBox.setAttribute('placeholder', `Search in ${basename(directory)}...`)
                // doSearch();
            // }
        // });
}

searchBox.setAttribute('placeholder', `Search in ${basename(directory)}...`)