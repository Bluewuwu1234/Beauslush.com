(() => {
    const size = 15;
    const board = document.getElementById('gomokuBoard');
    const turnText = document.getElementById('turnText');
    const turnStone = document.getElementById('turnStone');
    const message = document.getElementById('gameMessage');
    const cells = [];
    let state = Array.from({ length: size }, () => Array(size).fill(null));
    let current = 'black';
    let difficulty = 'easy';
    let finished = false;
    let botThinking = false;
    let moveCount = 0;

    function updateTurn() {
        const blackTurn = current === 'black';
        turnText.textContent = blackTurn ? 'You (Black)' : botThinking ? 'Bot thinking…' : 'Bot (White)';
        turnStone.className = `turn-stone ${current}-stone`;
        document.getElementById('blackPlayer').classList.toggle('active', blackTurn && !finished);
        document.getElementById('whitePlayer').classList.toggle('active', !blackTurn && !finished);
    }

    function renderCounts() {
        let black = 0;
        let white = 0;
        state.forEach(row => row.forEach(stone => {
            if (stone === 'black') black++;
            if (stone === 'white') white++;
        }));
        document.getElementById('blackCount').textContent = black;
        document.getElementById('whiteCount').textContent = white;
    }

    function getLine(row, col, rowStep, colStep, stone) {
        const line = [{ row, col }];
        for (const direction of [-1, 1]) {
            let nextRow = row + rowStep * direction;
            let nextCol = col + colStep * direction;
            while (nextRow >= 0 && nextRow < size && nextCol >= 0 && nextCol < size && state[nextRow][nextCol] === stone) {
                line.push({ row: nextRow, col: nextCol });
                nextRow += rowStep * direction;
                nextCol += colStep * direction;
            }
        }
        return line;
    }

    function findWin(row, col, stone) {
        for (const [rowStep, colStep] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
            const line = getLine(row, col, rowStep, colStep, stone);
            if (line.length >= 5) return line;
        }
        return null;
    }

    function finishGame(winningLine, stone) {
        finished = true;
        winningLine.forEach(point => cells[point.row][point.col].classList.add('winning-move'));
        const winner = stone === 'black' ? 'You win!' : 'The bot wins!';
        turnText.textContent = winner;
        message.textContent = `${winner} Five in a row.`;
        document.getElementById('blackPlayer').classList.remove('active');
        document.getElementById('whitePlayer').classList.remove('active');
    }

    function placeStone(row, col, stone) {
        if (finished || state[row][col]) return false;
        state[row][col] = stone;
        moveCount++;
        const cell = cells[row][col];
        cell.dataset.stone = stone;
        cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, ${stone}`);
        board.querySelectorAll('.last-move').forEach(previous => previous.classList.remove('last-move'));
        cell.classList.add('last-move');
        renderCounts();

        const winningLine = findWin(row, col, stone);
        if (winningLine) {
            finishGame(winningLine, stone);
            return true;
        }
        if (moveCount === size * size) {
            finished = true;
            turnText.textContent = 'Draw';
            message.textContent = 'The board is full. Start a new game to play again.';
            document.getElementById('blackPlayer').classList.remove('active');
            document.getElementById('whitePlayer').classList.remove('active');
            return true;
        }

        current = stone === 'black' ? 'white' : 'black';
        if (current === 'white') {
            botThinking = true;
            message.textContent = 'Bot is thinking…';
            updateTurn();
            window.setTimeout(botMove, 280);
        } else {
            botThinking = false;
            message.textContent = 'Your turn.';
            updateTurn();
        }
        return true;
    }

    function candidateMoves() {
        const candidates = new Map();
        let hasStone = false;
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (!state[row][col]) continue;
                hasStone = true;
                for (let rowOffset = -2; rowOffset <= 2; rowOffset++) {
                    for (let colOffset = -2; colOffset <= 2; colOffset++) {
                        const nextRow = row + rowOffset;
                        const nextCol = col + colOffset;
                        if (nextRow >= 0 && nextRow < size && nextCol >= 0 && nextCol < size && !state[nextRow][nextCol]) {
                            candidates.set(`${nextRow},${nextCol}`, { row: nextRow, col: nextCol });
                        }
                    }
                }
            }
        }
        if (!hasStone) return [{ row: 7, col: 7 }];
        return [...candidates.values()];
    }

    function winsAt(row, col, stone) {
        state[row][col] = stone;
        const winning = Boolean(findWin(row, col, stone));
        state[row][col] = null;
        return winning;
    }

    function scoreAt(row, col, stone) {
        state[row][col] = stone;
        let total = 0;
        for (const [rowStep, colStep] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
            let count = 1;
            let openEnds = 0;
            for (const direction of [-1, 1]) {
                let nextRow = row + rowStep * direction;
                let nextCol = col + colStep * direction;
                while (nextRow >= 0 && nextRow < size && nextCol >= 0 && nextCol < size && state[nextRow][nextCol] === stone) {
                    count++;
                    nextRow += rowStep * direction;
                    nextCol += colStep * direction;
                }
                if (nextRow >= 0 && nextRow < size && nextCol >= 0 && nextCol < size && !state[nextRow][nextCol]) openEnds++;
            }
            if (count >= 5) total += 10000000;
            else if (count === 4) total += openEnds === 2 ? 120000 : openEnds === 1 ? 25000 : 0;
            else if (count === 3) total += openEnds === 2 ? 5000 : openEnds === 1 ? 650 : 0;
            else if (count === 2) total += openEnds === 2 ? 280 : openEnds === 1 ? 40 : 0;
            else if (count === 1 && openEnds === 2) total += 4;
        }
        state[row][col] = null;
        return total;
    }

    function chooseEasyMove(candidates) {
        const winningMove = candidates.find(move => winsAt(move.row, move.col, 'white'));
        if (winningMove) return winningMove;
        const blockingMove = candidates.find(move => winsAt(move.row, move.col, 'black'));
        if (blockingMove && Math.random() < 0.72) return blockingMove;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    function chooseHardMove(candidates) {
        const winningMove = candidates.find(move => winsAt(move.row, move.col, 'white'));
        if (winningMove) return winningMove;
        const blockingMove = candidates.find(move => winsAt(move.row, move.col, 'black'));
        if (blockingMove) return blockingMove;

        let bestScore = -Infinity;
        let bestMoves = [];
        for (const move of candidates) {
            const attack = scoreAt(move.row, move.col, 'white');
            const defense = scoreAt(move.row, move.col, 'black');
            const centerBonus = size - Math.abs(7 - move.row) - Math.abs(7 - move.col);
            const score = attack + defense * 1.12 + centerBonus;
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    function botMove() {
        if (finished || current !== 'white') return;
        const candidates = candidateMoves();
        if (!candidates.length) return;
        const move = difficulty === 'hard' ? chooseHardMove(candidates) : chooseEasyMove(candidates);
        botThinking = false;
        placeStone(move.row, move.col, 'white');
    }

    function buildBoard() {
        board.replaceChildren();
        cells.length = 0;
        for (let row = 0; row < size; row++) {
            cells[row] = [];
            for (let col = 0; col < size; col++) {
                const cell = document.createElement('button');
                cell.type = 'button';
                cell.className = 'gomoku-cell';
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, empty`);
                cell.tabIndex = row === 7 && col === 7 ? 0 : -1;
                cell.addEventListener('click', () => {
                    if (current === 'black' && !botThinking) placeStone(row, col, 'black');
                });
                cell.addEventListener('keydown', event => {
                    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
                    const move = moves[event.key];
                    if (!move) return;
                    event.preventDefault();
                    const nextRow = Math.max(0, Math.min(size - 1, row + move[0]));
                    const nextCol = Math.max(0, Math.min(size - 1, col + move[1]));
                    cells.forEach(line => line.forEach(item => { item.tabIndex = item === cells[nextRow][nextCol] ? 0 : -1; }));
                    cells[nextRow][nextCol].focus();
                });
                cells[row][col] = cell;
                board.append(cell);
            }
        }
    }

    function newGame() {
        state = Array.from({ length: size }, () => Array(size).fill(null));
        current = 'black';
        finished = false;
        botThinking = false;
        moveCount = 0;
        buildBoard();
        message.textContent = `You play first as Black. ${difficulty === 'hard' ? 'Hard' : 'Easy'} bot selected.`;
        updateTurn();
        renderCounts();
        cells[7][7].focus();
    }

    function setDifficulty(level) {
        difficulty = level;
        document.getElementById('easyMode').classList.toggle('active', level === 'easy');
        document.getElementById('easyMode').setAttribute('aria-pressed', String(level === 'easy'));
        document.getElementById('hardMode').classList.toggle('active', level === 'hard');
        document.getElementById('hardMode').setAttribute('aria-pressed', String(level === 'hard'));
        newGame();
    }

    document.getElementById('newGame').addEventListener('click', newGame);
    document.getElementById('easyMode').addEventListener('click', () => setDifficulty('easy'));
    document.getElementById('hardMode').addEventListener('click', () => setDifficulty('hard'));
    newGame();
})();