const Alea = require("./alea");

let mazeSeeds = [new Date()];

const UNVISITED = 0;
const INLIST = 1;
const VISITED = 2;

function getFullMaze(width, height) {
	const rows = new Array(height);
	for (let i = 0; i < height; i++) {
		const row = rows[i] = new Array(width);
		for (let j = 0; j < width; j++) {
			row[j] = {
				i,
				j,
				left: j === 0 ? -1 : null,
				right: j === width - 1 ? -1 : null,
				top: i === 0 ? -1 : null,
				bottom: i === height - 1 ? -1 : null,
				state: UNVISITED,
			};
		}
	}

	return rows;
}

function getNeighbors(maze, cell) {
	const height = maze.length - 1;
	const width = maze[0].length - 1;

	return {
		left: cell.j > 0 ? maze[cell.i][cell.j - 1] : null,
		right: cell.j < width ? maze[cell.i][cell.j + 1] : null,
		top: cell.i > 0 ? maze[cell.i - 1][cell.j] : null,
		bottom: cell.i < height ? maze[cell.i + 1][cell.j] : null,
	};
}

function getConnectors(maze, cell) {
	const wallConnectors = [];
	const {left, right, top, bottom} = getNeighbors(maze, cell);

	if (cell.left == null && left.state === VISITED) {
		wallConnectors.push(() => {
			cell.left = left;
			left.right = cell;
		});
	}
	if (cell.right == null && right.state === VISITED) {
		wallConnectors.push(() => {
			cell.right = right;
			right.left = cell;
		});
	}
	if (cell.top == null && top.state === VISITED) {
		wallConnectors.push(() => {
			cell.top = top;
			top.bottom = cell;
		});
	}
	if (cell.bottom == null && bottom.state === VISITED) {
		wallConnectors.push(() => {
			cell.bottom = bottom;
			bottom.top = cell;
		});
	}

	return wallConnectors;
}

function addNeighbors(maze, cell, list) {
	const {left, right, top, bottom} = getNeighbors(maze, cell);

	if (cell.left == null && left.state === UNVISITED) {
		left.state = INLIST;
		list.push(left);
	}
	if (cell.right == null && right.state === UNVISITED) {
		right.state = INLIST;
		list.push(right);
	}
	if (cell.top == null && top.state === UNVISITED) {
		top.state = INLIST;
		list.push(top);
	}
	if (cell.bottom == null && bottom.state === UNVISITED) {
		bottom.state = INLIST;
		list.push(bottom);
	}
}

function countRemainingNeighbors(cell) {
	let count = 0;

	if (cell.left == null) count++;
	if (cell.right == null) count++;
	if (cell.top == null) count++;
	if (cell.bottom == null) count++;

	return count;
}

function generate(width, height, chamberBias) {
	const alea = new Alea(mazeSeeds);
	const maze = getFullMaze(width, height);

	const cellList = [];
	const initialI = Math.floor(alea() * height);
	const initialJ = Math.floor(alea() * width);
	const initialCell = maze[initialI][initialJ];
	initialCell.state = VISITED;
	addNeighbors(maze, initialCell, cellList);

	while (cellList.length) {
		const index = Math.floor(alea() * cellList.length);
		const cell = cellList[index];
		cell.state = VISITED;
		addNeighbors(maze, cell, cellList);

		const wallConnectors = getConnectors(maze, cell);
		if (wallConnectors.length) {
			const chosenIndex = Math.floor(alea() * wallConnectors.length);
			wallConnectors[chosenIndex]();
		}

		const remaining = countRemainingNeighbors(cell);
		const passValue = remaining / 4;
		if (alea() > passValue * chamberBias) {
			cellList.splice(index, 1);
		}
	}

	return maze;
}

module.exports = {
	generate,
	seed: (...seeds) => mazeSeeds = seeds,
};
