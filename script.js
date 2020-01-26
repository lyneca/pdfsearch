const spawn = require('child_process').spawn;
const basename = require('path').basename;
const searchBox = document.getElementById('search');
const directoryButton = document.getElementById('directory');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const app = require('electron').remote.app;
let dialog = require('electron').remote.dialog;
let directory = app.getPath('downloads');

function renderResult(query, path, lines) {
    const filename = basename(path);
    const regex = new RegExp(query, "i");

    console.log(lines)

    return `<div class="result">
        <div class="result-filename">${filename}</div>
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

function search(query) {
    console.log(directory)
    const process = spawn("pdfgrep", [query, "-inr", directory]);
    loading.style.display = "block";
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
        console.log(uniqueList);
        loading.style.display = "none";
        results.innerHTML = uniqueList.map(filename => renderResult(
            query,
            filename,
            outputList.filter(item => item.split(':')[0] === filename)
                .slice(0, 10)
        )).join('');
    });
}

function clear() {
    results.innerHTML = "";
}

searchBox.oninput = () => {
    const query = searchBox.value;
    if (query === "") clear();
    else search(query);
}

directoryButton.onclick = () => {
    dialog.showOpenDialog({ 'properties': ['openDirectory'] })
        .then(dir => {
            console.log(dir);
            if (dir !== undefined && dir.filePaths.length > 0) {
                directory = dir.filePaths[0]
                searchBox.setAttribute('placeholder', `Search in ${basename(directory)}...`)
            }
        });
}

searchBox.setAttribute('placeholder', `Search in ${basename(directory)}...`)