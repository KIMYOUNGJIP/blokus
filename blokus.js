document.addEventListener('DOMContentLoaded', () => {
    const BOARD_SIZE = 20;
    const boardElement = document.getElementById('game-board');
    const player1PiecesElement = document.getElementById('player1-pieces');
    const player2PiecesElement = document.getElementById('player2-pieces');
    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');
    const player1Title = document.getElementById('player1-title');
    const player2Title = document.getElementById('player2-title');

    const gameModeSelect = document.getElementById('game-mode');
    const difficultySelect = document.getElementById('difficulty');
    const difficultyLabel = document.getElementById('difficulty-label');
    const newGameButton = document.getElementById('new-game-button');
    const rotateButton = document.getElementById('rotate-button');
    const flipButton = document.getElementById('flip-button');

    const gameOverMessage = document.getElementById('game-over-message');
    const finalScoreElement = document.getElementById('final-score');
    const winnerElement = document.getElementById('winner');

    let board = [];
    let player1Pieces = [];
    let player2Pieces = [];
    let selectedPiece = null;
    let currentPlayer = 'player1';
    let gameMode = 'computer'; // 'computer' or 'human'
    let player1CanPlay = true;
    let player2CanPlay = true;

    const PIECES = {
        '1': [[1]], '2': [[1, 1]], '3': [[1, 1, 1]], '4': [[1, 1, 1, 1]], '5': [[1, 1, 1, 1, 1]],
        'L5': [[1, 0, 0, 0], [1, 1, 1, 1]], 'Y': [[1, 1, 1, 1], [0, 1, 0, 0]], 'P': [[1, 1], [1, 1, 1]],
        'T4': [[1, 1, 1], [0, 1, 0]], 'O4': [[1, 1], [1, 1]], 'I4': [[1, 1, 1, 1]],
        'L4': [[1, 0, 0], [1, 1, 1]], 'Z4': [[1, 1, 0], [0, 1, 1]], 'N': [[1, 1, 0, 0], [0, 1, 1, 1]],
        'F': [[0, 1, 1], [1, 1, 0], [0, 1, 0]], 'X': [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
        'U': [[1, 0, 1], [1, 1, 1]], 'W': [[1, 0, 0], [1, 1, 0], [0, 1, 1]],
        'T5': [[1, 1, 1], [0, 1, 0], [0, 1, 0]], 'V3': [[1, 0, 0], [1, 1, 1]], 'I3': [[1, 1, 1]]
    };

    function createBoard() {
        board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
        boardElement.innerHTML = '';
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.addEventListener('click', () => placePiece(r, c));
                cell.addEventListener('mouseover', () => handleMouseOver(r, c));
                cell.addEventListener('mouseout', handleMouseOut);
                boardElement.appendChild(cell);
            }
        }
    }

    function createPieces(owner) {
        return Object.keys(PIECES).map(name => ({ name, shape: PIECES[name], owner }));
    }

    function renderPieces(pieces, element, owner) {
        element.innerHTML = '';
        pieces.forEach((piece, index) => {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece-preview');
            pieceElement.dataset.owner = owner;
            pieceElement.dataset.index = index;
            pieceElement.style.gridTemplateRows = `repeat(${piece.shape.length}, 15px)`;
            pieceElement.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 15px)`;

            for (let r = 0; r < piece.shape.length; r++) {
                for (let c = 0; c < piece.shape[r].length; c++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    if (piece.shape[r][c]) {
                        cell.classList.add(owner === 'player1' ? 'player-piece' : 'player2-piece');
                    }
                    pieceElement.appendChild(cell);
                }
            }
            pieceElement.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent board click
                selectPiece(piece, pieceElement);
            });
            element.appendChild(pieceElement);
        });
    }

    function selectPiece(piece, element) {
        if (piece.owner !== currentPlayer) return;

        if (selectedPiece && selectedPiece.element) {
            selectedPiece.element.classList.remove('selected');
        }
        selectedPiece = { piece, element };
        element.classList.add('selected');
    }

    function rotatePiece() {
        if (!selectedPiece) return;
        const shape = selectedPiece.piece.shape;
        const newShape = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse());
        selectedPiece.piece.shape = newShape;
        const pieces = currentPlayer === 'player1' ? player1Pieces : player2Pieces;
        const element = currentPlayer === 'player1' ? player1PiecesElement : player2PiecesElement;
        renderPieces(pieces, element, currentPlayer);
        const newElement = element.querySelector(`[data-index='${pieces.indexOf(selectedPiece.piece)}']`);
        if (newElement) selectPiece(selectedPiece.piece, newElement);
    }

    function flipPiece() {
        if (!selectedPiece) return;
        selectedPiece.piece.shape.forEach(row => row.reverse());
        const pieces = currentPlayer === 'player1' ? player1Pieces : player2Pieces;
        const element = currentPlayer === 'player1' ? player1PiecesElement : player2PiecesElement;
        renderPieces(pieces, element, currentPlayer);
        const newElement = element.querySelector(`[data-index='${pieces.indexOf(selectedPiece.piece)}']`);
        if (newElement) selectPiece(selectedPiece.piece, newElement);
    }

    function isValidPlacement(piece, r, c) {
        const currentPieces = piece.owner === 'player1' ? player1Pieces : player2Pieces;
        const isFirstMove = currentPieces.length === 21;
        let touchesCorner = false;
        let overlaps = false;
        let touchesSide = false;

        for (let pr = 0; pr < piece.shape.length; pr++) {
            for (let pc = 0; pc < piece.shape[pr].length; pc++) {
                if (piece.shape[pr][pc]) {
                    const br = r + pr;
                    const bc = c + pc;

                    if (br < 0 || br >= BOARD_SIZE || bc < 0 || bc >= BOARD_SIZE || board[br][bc]) {
                        return false; // Overlaps or out of bounds
                    }

                    if (isFirstMove) {
                        if ((piece.owner === 'player1' && br === 0 && bc === 0) ||
                            (piece.owner === 'player2' && br === BOARD_SIZE - 1 && bc === BOARD_SIZE - 1)) {
                            touchesCorner = true;
                        }
                    } else {
                        [[br - 1, bc - 1], [br - 1, bc + 1], [br + 1, bc - 1], [br + 1, bc + 1]].forEach(([nr, nc]) => {
                            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === piece.owner) {
                                touchesCorner = true;
                            }
                        });
                        [[br - 1, bc], [br + 1, bc], [br, bc - 1], [br, bc + 1]].forEach(([nr, nc]) => {
                            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === piece.owner) {
                                touchesSide = true;
                            }
                        });
                    }
                }
            }
        }

        if (touchesSide) return false;
        return isFirstMove ? touchesCorner : touchesCorner;
    }

    function placePiece(r, c) {
        if (!selectedPiece) return;

        if (isValidPlacement(selectedPiece.piece, r, c)) {
            const piece = selectedPiece.piece;
            for (let pr = 0; pr < piece.shape.length; pr++) {
                for (let pc = 0; pc < piece.shape[pr].length; pc++) {
                    if (piece.shape[pr][pc]) {
                        board[r + pr][c + pc] = piece.owner;
                    }
                }
            }

            const pieces = currentPlayer === 'player1' ? player1Pieces : player2Pieces;
            const pieceIndex = pieces.indexOf(piece);
            pieces.splice(pieceIndex, 1);

            handleMouseOut();
            renderBoard();
            renderPieces(player1Pieces, player1PiecesElement, 'player1');
            renderPieces(player2Pieces, player2PiecesElement, 'player2');
            updateScores();
            selectedPiece = null;
            
            switchTurn();
        } else {
            alert('놓을 수 없는 위치입니다.');
        }
    }

    function switchTurn() {
        currentPlayer = (currentPlayer === 'player1') ? 'player2' : 'player1';
        updateActivePlayerUI();

        if (!hasValidMoves(currentPlayer)) {
            alert(`${currentPlayer === 'player1' ? '플레이어 1' : '플레이어 2'}이(가) 더 이상 둘 곳이 없습니다. 턴을 넘깁니다.`);
            if (currentPlayer === 'player1') player1CanPlay = false; else player2CanPlay = false;
            
            if (!player1CanPlay && !player2CanPlay) {
                endGame();
                return;
            }
            switchTurn(); // Skip the turn
            return;
        }

        if (gameMode === 'computer' && currentPlayer === 'player2') {
            setTimeout(computerMove, 500);
        }
    }

    function computerMove() {
        const difficulty = difficultySelect.value;
        const move = findBestMove(difficulty);

        if (move) {
            const { piece, r, c, rotatedShape } = move;
            piece.shape = rotatedShape;
            for (let pr = 0; pr < piece.shape.length; pr++) {
                for (let pc = 0; pc < piece.shape[pr].length; pc++) {
                    if (piece.shape[pr][pc]) {
                        board[r + pr][c + pc] = 'player2';
                    }
                }
            }
            const pieceIndex = player2Pieces.indexOf(piece);
            player2Pieces.splice(pieceIndex, 1);
            renderBoard();
            renderPieces(player2Pieces, player2PiecesElement, 'player2');
            updateScores();
        } else {
            console.log("컴퓨터가 둘 곳이 없습니다.");
            player2CanPlay = false;
        }
        switchTurn();
    }

    function findBestMove(difficulty) {
        const availableMoves = [];
        for (const piece of player2Pieces) {
            for (let i = 0; i < 8; i++) { // 4 rotations, 2 flips
                let currentShape = JSON.parse(JSON.stringify(piece.shape)); // Deep copy
                if (i >= 4) currentShape = currentShape.map(row => row.reverse());
                for (let j = 0; j < (i % 4); j++) {
                    currentShape = currentShape[0].map((_, colIndex) => currentShape.map(row => row[colIndex]).reverse());
                }
                for (let r = 0; r < BOARD_SIZE; r++) {
                    for (let c = 0; c < BOARD_SIZE; c++) {
                        if (isValidPlacement({ ...piece, shape: currentShape }, r, c)) {
                            availableMoves.push({ piece, r, c, rotatedShape: currentShape });
                        }
                    }
                }
            }
        }
        if (availableMoves.length === 0) return null;
        // Simple logic for now, can be expanded
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    function hasValidMoves(player) {
        const pieces = player === 'player1' ? player1Pieces : player2Pieces;
        for (const piece of pieces) {
            for (let i = 0; i < 8; i++) { 
                let currentShape = JSON.parse(JSON.stringify(piece.shape));
                if (i >= 4) currentShape = currentShape.map(row => row.reverse());
                for (let j = 0; j < (i % 4); j++) {
                    currentShape = currentShape[0].map((_, colIndex) => currentShape.map(row => row[colIndex]).reverse());
                }
                for (let r = 0; r < BOARD_SIZE; r++) {
                    for (let c = 0; c < BOARD_SIZE; c++) {
                        if (isValidPlacement({ ...piece, shape: currentShape }, r, c)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    function handleMouseOver(r, c) {
        if (!selectedPiece) return;
        handleMouseOut();
        const previewClass = currentPlayer === 'player1' ? 'preview-player1' : 'preview-player2';
        for (let pr = 0; pr < selectedPiece.piece.shape.length; pr++) {
            for (let pc = 0; pc < selectedPiece.piece.shape[pr].length; pc++) {
                if (selectedPiece.piece.shape[pr][pc]) {
                    const br = r + pr;
                    const bc = c + pc;
                    if (br >= 0 && br < BOARD_SIZE && bc >= 0 && bc < BOARD_SIZE) {
                        const cell = boardElement.children[br * BOARD_SIZE + bc];
                        if (!board[br][bc]) cell.classList.add(previewClass);
                    }
                }
            }
        }
    }

    function handleMouseOut() {
        for (let i = 0; i < boardElement.children.length; i++) {
            boardElement.children[i].classList.remove('preview-player1', 'preview-player2');
        }
    }

    function renderBoard() {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = boardElement.children[r * BOARD_SIZE + c];
                cell.className = 'cell';
                if (board[r][c]) {
                    cell.classList.add(board[r][c] === 'player1' ? 'player-piece' : 'player2-piece');
                }
            }
        }
    }

    function updateScores() {
        player1ScoreElement.textContent = player1Pieces.reduce((acc, p) => acc + p.shape.flat().reduce((a, c) => a + c, 0), 0);
        player2ScoreElement.textContent = player2Pieces.reduce((acc, p) => acc + p.shape.flat().reduce((a, c) => a + c, 0), 0);
    }

    function updateActivePlayerUI() {
        if (currentPlayer === 'player1') {
            player1Title.style.color = 'gold';
            player2Title.style.color = 'black';
        } else {
            player1Title.style.color = 'black';
            player2Title.style.color = 'gold';
        }
    }

    function endGame() {
        gameOverMessage.classList.remove('hidden');
        const p1Score = parseInt(player1ScoreElement.textContent);
        const p2Score = parseInt(player2ScoreElement.textContent);
        finalScoreElement.textContent = `플레이어 1: ${p1Score}점, 플레이어 2: ${p2Score}점`;
        if (p1Score < p2Score) {
            winnerElement.textContent = "플레이어 1이 이겼습니다!";
        } else if (p2Score < p1Score) {
            winnerElement.textContent = "플레이어 2가 이겼습니다!";
        } else {
            winnerElement.textContent = "비겼습니다.";
        }
    }

    function startNewGame() {
        gameMode = gameModeSelect.value;
        if (gameMode === 'computer') {
            difficultyLabel.style.display = 'inline-block';
            difficultySelect.style.display = 'inline-block';
            player2Title.textContent = '컴퓨터 (빨강)';
        } else {
            difficultyLabel.style.display = 'none';
            difficultySelect.style.display = 'none';
            player2Title.textContent = '플레이어 2 (빨강)';
        }

        createBoard();
        player1Pieces = createPieces('player1');
        player2Pieces = createPieces('player2');
        renderPieces(player1Pieces, player1PiecesElement, 'player1');
        renderPieces(player2Pieces, player2PiecesElement, 'player2');
        updateScores();
        selectedPiece = null;
        currentPlayer = 'player1';
        player1CanPlay = true;
        player2CanPlay = true;
        gameOverMessage.classList.add('hidden');
        updateActivePlayerUI();
    }

    gameModeSelect.addEventListener('change', () => {
        gameMode = gameModeSelect.value;
        if (gameMode === 'computer') {
            difficultyLabel.style.display = 'inline-block';
            difficultySelect.style.display = 'inline-block';
        } else {
            difficultyLabel.style.display = 'none';
            difficultySelect.style.display = 'none';
        }
    });

    newGameButton.addEventListener('click', startNewGame);
    rotateButton.addEventListener('click', rotatePiece);
    flipButton.addEventListener('click', flipPiece);

    startNewGame();
});
