const tableBody = document.getElementById("tableBody");
const addBtn = document.getElementById("addTeam");
const resetBtn = document.getElementById("reset");
const downloadBtn = document.getElementById("download");
const addMatchBtn = document.getElementById("addMatch");
const removeMatchBtn = document.getElementById("removeMatch");
const headerRow1 = document.getElementById("headerRow1");
const headerRow2 = document.getElementById("headerRow2");
const totalHeader = document.getElementById("totalHeader");

const MIN_MATCHES = 1;
const MAX_MATCHES = 10;

// Starting match count matches the 4 columns already in the static HTML
let matchCount = 4;

// 1 -> I, 2 -> II ... used for the rank column
function toRoman(n){
    const map = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
    let out = "";
    map.forEach(([v, sym]) => { while(n >= v){ out += sym; n -= v; } });
    return out;
}

// Position -> points, per the uploaded point system
const POINT_TABLE = {1:12, 2:9, 3:8, 4:7, 5:6, 6:5, 7:4, 8:3, 9:2, 10:1};

function posPoints(pos){
    return POINT_TABLE[pos] || 0;
}

// Build the POS/KILLS cells (as HTML string) for a single match column
function matchCellsHTML(matchNum){
    return `
        <td data-match="${matchNum}"><input type="number" class="posInput" min="0" max="20" value="0" data-match="${matchNum}"></td>
        <td data-match="${matchNum}"><input type="number" class="killInput" min="0" value="0" data-match="${matchNum}"></td>
    `;
}

// Build all match cells for the current matchCount (used for new rows)
function allMatchCellsHTML(){
    let html = "";
    for(let i = 1; i <= matchCount; i++){
        html += matchCellsHTML(i);
    }
    return html;
}

// Recalculate a single row's WIN / TOTAL from its per-match inputs
function recalcRow(row){
    const posInputs = row.querySelectorAll(".posInput");
    const killInputs = row.querySelectorAll(".killInput");

    let total = 0;
    let wins = 0;

    posInputs.forEach((posInput, idx) => {

        const pos = Number(posInput.value) || 0;
        const kills = Number(killInputs[idx].value) || 0;

        total += posPoints(pos) + kills;

        if(pos === 1){
            wins++;
        }

    });

    row.querySelector(".total-value").textContent = total;
    row.querySelector(".win-value").textContent = wins;
    row.querySelector(".mp-value").textContent = matchCount;
}

// Wire up input/change listeners for every input in a row
function attachRowEvents(row){

    const inputs = row.querySelectorAll("input");

    inputs.forEach(input => {

        input.addEventListener("input", () => {
            recalcRow(row);
        });

        input.addEventListener("change", () => {
            updateRanking();
        });

    });

    row.querySelector(".deleteBtn").onclick = () => {
        row.remove();
        updateRanking();
    };

}

// Create Team Row
function createRow(team = "") {

    const row = document.createElement("tr");

    row.innerHTML = `
        <td class="rank"><span class="rank-num">–</span></td>

        <td>
        <input type="text" class="teamName" placeholder="Team Name" value="${team}">
        </td>

        <td class="mp"><span class="mp-value">${matchCount}</span></td>

        <td class="win"><span class="win-value">0</span></td>

        ${allMatchCellsHTML()}

        <td class="total"><span class="total-value">0</span></td>

        <td><button class="deleteBtn">🗑</button></td>

    `;

    tableBody.appendChild(row);

    attachRowEvents(row);

    updateRanking();
}

// Add Team
addBtn.onclick = () => {
    createRow();
};

// Add a new match column (POS + KILLS) to the header and every existing row
addMatchBtn.onclick = () => {

    if(matchCount >= MAX_MATCHES) return;

    matchCount++;

    // Header: group th (colspan 2) inserted before TOTAL
    const groupTh = document.createElement("th");
    groupTh.colSpan = 2;
    groupTh.className = "match-group-header";
    groupTh.dataset.match = matchCount;
    groupTh.textContent = "M" + matchCount;
    headerRow1.insertBefore(groupTh, totalHeader);

    // Header: POS / K sub-headers appended to row 2
    const posTh = document.createElement("th");
    posTh.className = "sub-head";
    posTh.dataset.match = matchCount;
    posTh.textContent = "POS";

    const killTh = document.createElement("th");
    killTh.className = "sub-head";
    killTh.dataset.match = matchCount;
    killTh.textContent = "K";

    headerRow2.appendChild(posTh);
    headerRow2.appendChild(killTh);

    // Rows: insert two new cells before the TOTAL cell
    [...tableBody.querySelectorAll("tr")].forEach(row => {

        const totalTd = row.querySelector(".total");

        const posTd = document.createElement("td");
        posTd.dataset.match = matchCount;
        posTd.innerHTML = `<input type="number" class="posInput" min="0" max="20" value="0" data-match="${matchCount}">`;

        const killTd = document.createElement("td");
        killTd.dataset.match = matchCount;
        killTd.innerHTML = `<input type="number" class="killInput" min="0" value="0" data-match="${matchCount}">`;

        row.insertBefore(posTd, totalTd);
        row.insertBefore(killTd, totalTd);

        [posTd.querySelector("input"), killTd.querySelector("input")].forEach(input => {

            input.addEventListener("input", () => recalcRow(row));
            input.addEventListener("change", () => updateRanking());

        });

    });

    updateRanking();
};

// Remove the last match column from the header and every existing row
removeMatchBtn.onclick = () => {

    if(matchCount <= MIN_MATCHES) return;

    document.querySelectorAll(`th[data-match="${matchCount}"]`).forEach(th => th.remove());

    [...tableBody.querySelectorAll("tr")].forEach(row => {
        row.querySelectorAll(`td[data-match="${matchCount}"]`).forEach(td => td.remove());
    });

    matchCount--;

    updateRanking();
};

// Reset
resetBtn.onclick = () => {

    if(confirm("Reset all teams?")){

        tableBody.innerHTML = "";

        createRow("TEAM 1");

    }

};

// Ranking Function
function updateRanking() {

    const rows = [...tableBody.querySelectorAll("tr")];

    // Recalculate totals / wins for every row first
    rows.forEach(row => recalcRow(row));

    // Sort by TOTAL desc, tie-break by WIN desc
    rows.sort((a, b) => {

        const totalA = Number(a.querySelector(".total-value").textContent);
        const totalB = Number(b.querySelector(".total-value").textContent);

        if(totalA === totalB){

            const winA = Number(a.querySelector(".win-value").textContent);
            const winB = Number(b.querySelector(".win-value").textContent);

            return winB - winA;

        }

        return totalB - totalA;

    });

    // Re-append in sorted order
    rows.forEach(row => tableBody.appendChild(row));

    // Update Rank
    rows.forEach((row, index) => {
        row.querySelector(".rank-num").textContent = toRoman(index + 1);
    });

}

// Build a plain, single-row-header snapshot table (Rank / Team / MP / WIN / POS / KILLS / TOTAL)
// with no match-by-match breakdown — this is what gets exported to PNG.
function buildExportSnapshot() {

    const rows = [...tableBody.querySelectorAll("tr")]; // already sorted

    const rowsHTML = rows.map((row, index) => {

        const teamName = row.querySelector(".teamName").value || "TEAM";
        const mp = row.querySelector(".mp-value").textContent;
        const win = row.querySelector(".win-value").textContent;
        const total = row.querySelector(".total-value").textContent;

        let posSum = 0;
        let killSum = 0;

        row.querySelectorAll(".posInput").forEach(p => {
            posSum += posPoints(Number(p.value) || 0);
        });

        row.querySelectorAll(".killInput").forEach(k => {
            killSum += Number(k.value) || 0;
        });

        return `
            <tr>
                <td class="rank"><span class="rank-num">${toRoman(index + 1)}</span></td>
                <td class="teamName-display">${teamName}</td>
                <td><span class="mp-value">${mp}</span></td>
                <td><span class="win-value">${win}</span></td>
                <td><span class="export-value">${posSum}</span></td>
                <td><span class="export-value">${killSum}</span></td>
                <td class="total"><span class="total-value">${total}</span></td>
            </tr>
        `;

    }).join("");

    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "0";
    wrapper.style.left = "-99999px";

    wrapper.innerHTML = `
        <div class="capture-area" style="width:900px;">
            <h1>HAMRO SCRIM OFFICIAL</h1>
            <h2>Daily Scrim</h2>
            <div class="leaderboard">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Team Name</th>
                            <th>MP</th>
                            <th>WIN</th>
                            <th>POS</th>
                            <th>KILLS</th>
                            <th>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.body.appendChild(wrapper);

    return wrapper;
}

// Download PNG — renders the plain snapshot (no M1-M4 columns), matching the original layout
downloadBtn.onclick = () => {

    const snapshot = buildExportSnapshot();
    const captureEl = snapshot.querySelector(".capture-area");

    html2canvas(captureEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#080808"
    }).then(canvas => {

        const link = document.createElement("a");

        link.download = "Hamro-Scrim-Official.png";
        link.href = canvas.toDataURL("image/png");
        link.click();

        snapshot.remove();

    }).catch(() => {
        snapshot.remove();
    });

};

// First Team
createRow("TEAM 1");
