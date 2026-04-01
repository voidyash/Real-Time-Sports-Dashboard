const socket = io("http://localhost:3000")

const teamLogos = {}

let lastKey = "";
let prevOrder = [];
let prevState = {};
let prevElims = {};

// LISTEN FOR UPDATES FROM BACKEND
socket.on("scoreUpdate", (data) => {
    // const key = data.map(t => `${t.team}-${t.alive}-${t.knocked}-${t.elims}`).join("|");
    const key = JSON.stringify(data);

    // if (key === lastKey) { return; }
    lastKey = key;

    console.log("UPDATE DATA:", data);
    updateScoreboard(data);
});

function normalizeTeam(name)
{
    return name.trim().toLowerCase().replace(/\s+/g,"_");
}

function updateScoreboard(data){
    const container = document.getElementById("scoreboard");

    if (data.length === 0) {
        container.innerHTML = "";
        return;
    }

    // store old positions
    const oldPositions = {};
    Array.from(container.children).forEach(el => {
        oldPositions[el.dataset.team] = el.getBoundingClientRect();
    });

    // sort
    data.sort((a, b) =>{
        if(b.elims !== a.elims) return b.elims - a.elims;
        return b.alive - a.alive;
    });

    const elements = {};
    Array.from(container.children).forEach(el => {
        elements[el.dataset.team] = el;
    });

    data.forEach(team => {
        const key = normalizeTeam(team.team);
        const prev = prevState[key] || { alive:0, knocked:0 };

        // team._changedIndex = -1;
        // team._changeType = null;
        team._rowEffect = null;

        if (team.alive !== prev.alive) {
            if (team.alive > prev.alive) {
                // team._changedIndex = team.alive - 1;
                // team._changeType = "alive-up";
                team._rowEffect = "row-up";
            }else{
                // team._changedIndex = prev.alive - 1;
                // team._changeType = "alive-down";
                team._rowEffect = "row-down";
            }
        }
        else if (team.knocked !== prev.knocked) {
            // team._changedIndex = team.alive + team.knocked - 1;
            // team._changeType = "alive-down";
            team._rowEffect = "row-knock";
        }

        prevState[key] = {
            alive: team.alive,
            knocked: team.knocked
        };
    });

    data.forEach(team => {
        const key = normalizeTeam(team.team);
        const prev = prevElims[key] || 0;
        const diff = team.elims - prev;

        team._elimDiff = diff > 0 ? diff : 0;

        prevElims[key] = team.elims;
    });

    const newOrder = data.map(t => normalizeTeam(t.team));

    Array.from(container.children).forEach(el => {
        const key = el.dataset.team;

        if (!newOrder.includes(key)) {
            el.remove();
            delete elements[key];
        }
    });

    data.forEach((team, index) => {
        const key = normalizeTeam(team.team);
        team.rank = index + 1;

        let row = elements[key];

        if (!row) {
            row = createTeamRow(team);
        } else {
            // row.innerHTML = createTeamRow(team).innerHTML;

            const newRow = createTeamRow(team);

            // UPDATE ONLY INNER PARTS
            row.querySelector(".rank").textContent = newRow.querySelector(".rank").textContent;
            row.querySelector(".team span").textContent = newRow.querySelector(".team span").textContent;
            row.querySelector(".elims").textContent = newRow.querySelector(".elims").textContent;
            
            // UPDATE ONLY BARS
            row.querySelector(".players").innerHTML = newRow.querySelector(".players").innerHTML;

            // ROW EFFECT
            if (team._rowEffect){
                row.classList.remove("row-up", "row-down", "row-knock");
                void row.offsetWidth;
                row.classList.add(team._rowEffect);
            }
        }
        if (team._elimDiff > 0) {
            const elimsDiv = row.querySelector(".elims");

            const pop = document.createElement("div");
            pop.className = "elim-pop";
            pop.textContent = `+${team._elimDiff}`;

            elimsDiv.appendChild(pop);

            setTimeout(() => pop.remove(), 800);
        }

        elements[key] = row;
        // newOrder.push(key);
    });

    newOrder.forEach(key => {
        container.appendChild(elements[key]);
    });

    newOrder.forEach(key => {
        const row = elements[key];
        const oldRect = oldPositions[key];

        if (!oldRect) return;

        const newRect = row.getBoundingClientRect();
        const deltaY = oldRect.top - newRect.top;

        if(deltaY === 0) return;

        const movedUp = deltaY > 0;
        row.classList.remove("move-up", "move-down");

        if (movedUp) {
            row.classList.add("move-up");
        }else{
            row.classList.add("move-down");
        }

        if (deltaY !== 0) {
            row.style.transform = `translateY(${deltaY}px)`;
            row.style.transition = "transform 0s";

            requestAnimationFrame(() => {
                row.style.transform = "";
                row.style.transition = "transform 0.35s ease";
            });
            setTimeout(() => {
                row.classList.remove("move-up", "move-down");
            }, 600);
        }
    });

    prevOrder = newOrder;
}

function createTeamRow(team){
    const row = document.createElement("div");

    const alive = Math.min(team.alive, 4);
    const knocked = Math.min(team.knocked, 4 - alive);

    const key = normalizeTeam(team.team);

    const safeName = normalizeTeam(team.team);
                        // .replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    // const logo = `assets/image/${safeName}.png`;

    const logoHTML = `<img src="assets/image/${safeName}.png"
                class="team-logo"
                onerror="this.onerror=null;this.src='assets/image/${safeName}.jpg';
                this.onerror=function(){this.onerror=null;this.src='assets/image/${safeName}.jpeg';
                this.onerror=function(){this.onerror=null;this.src='assets/image/${safeName}.webp';
                this.onerror=function(){this.style.display='none';}}}">`;

    row.className = "team-row";

    row.setAttribute("data-team", normalizeTeam(team.team));

    // if(team._rowEffect){
    //     row.classList.add(team._rowEffect);
    // }

    // GENERATE 4 PLAYER BARS DYNAMICALLY
    const barsHTML = Array.from({length:4}, (_, i) => {
        
    let cls = "bar";

    if (i < alive) cls += " alive";
    else if (i < alive + knocked) cls += " knocked";
    else cls += " dead";

    if (i === team._changedIndex) {
        if (team._changeType === "alive-up") cls += " glow-up";
        else if (team._changeType === "alive-down") cls += " glow-down";
        else if (team._changeType === "knock") cls += " glow-knock";
    }

    return `<div class="${cls}"></div>`;

    }).join("");

    row.innerHTML = `<div class = "rank">${team.rank}</div>
                    <div class = "team"> ${logoHTML}
                        <span>${team.team}</span>
                    </div>
                    <div class = "players">${barsHTML}</div>
                    <div class = "elims">${team.elims}</div>`;
    
    return row;
}