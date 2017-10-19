const {Component} = require("react");
const PropTypes = require("prop-types");
const j = require("react-jenny");
const styles = require("./styles.css");

class Doodle extends Component {
	componentDidMount() {
		this.drawingContext = this.canvas.getContext("2d");
		const hue = ((this.props.id * 5) % 12) * 30;
		this.drawingContext.strokeStyle = `hsl(${hue}, 75%, 40%)`;
		this.drawingContext.lineWidth = 4;
		this.drawingContext.lineCap = "round";
		this.drawing = false;

		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		window.addEventListener("mousemove", this.onMouseMove);
		window.addEventListener("mouseup", this.onMouseUp);
	}
	componentWillUnmount() {
		window.removeEventListener("mouseup", this.onMouseUp);
		window.removeEventListener("mousemove", this.onMouseMove);
	}
	onMouseDown(event) {
		event.preventDefault();
		this.drawing = true;
		const rect = this.canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		this.drawingContext.beginPath();
		this.drawingContext.moveTo(x, y);
		this.drawingContext.stroke();

		this.props.onChange(this.canvas.toDataURL());
	}
	onMouseMove(event) {
		if (this.drawing) {
			const rect = this.canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			this.drawingContext.lineTo(x, y);
			this.drawingContext.stroke();

			this.props.onChange(this.canvas.toDataURL());
		}
	}
	onMouseUp(event) {
		if (this.drawing) {
			this.drawing = false;
			const rect = this.canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			this.drawingContext.lineTo(x, y);
			this.drawingContext.stroke();
			this.drawingContext.closePath();

			this.props.onChange(this.canvas.toDataURL());
		}
	}
	clear() {
		const width = this.canvas.width;
		const height = this.canvas.height;
		this.drawingContext.clearRect(0, 0, width, height);

		this.props.onChange(this.canvas.toDataURL());
	}
	getXY(event) {
		const newX = event.clientX - this.canvas.offsetLeft;
		const newY = event.clientY - this.canvas.offsetTop;

		const result = {oldX: this.x, oldY: this.y, newX, newY};

		this.x = newX;
		this.y = newY;

		return result;
	}
	render() {
		return j({div: 0}, [
			j({canvas: {
				className: styles.bordered,
				onMouseDown: this.onMouseDown.bind(this),
				height: 200,
				width: 200,
				ref: (ref) => this.canvas = ref,
			}}),
			j({br: 0}),
			j({button: {onClick: this.clear.bind(this)}}, ["clear"]),
		]);
	}
}

Doodle.propTypes = {
	id: PropTypes.number.isRequired,
	onChange: PropTypes.func.isRequired,
};

module.exports = Doodle;
