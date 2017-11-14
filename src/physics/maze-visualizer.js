const {Component} = require("react");
const PropTypes = require("prop-types");
const j = require("react-jenny");

const border = "1px solid black";
const boxSizing = "border-box";

class Maze extends Component {
	render() {
		return j({div: {style: {display: "inline-block", border}}},
			this.props.maze.map((row) => j("div",
				row.map((cell) => j({div: {style: {
					display: "inline-block",
					boxSizing,
					width: "80px",
					height: "80px",
					borderRight: cell.right == null ? border : "",
					borderBottom: cell.bottom == null ? border : "",
				}}})),
			)),
		);
	}
}

Maze.propTypes = {
	maze: PropTypes.arrayOf(PropTypes.array).isRequired,
};

module.exports = Maze;
