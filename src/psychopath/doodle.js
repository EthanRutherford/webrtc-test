const {Component} = require("react");
const PropTypes = require("prop-types");
const j = require("react-jenny");
const styles = require("./styles.css");

class Doodle extends Component {
	constructor(...args) {
		super(...args);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onTouchStart = this.onTouchStart.bind(this);
		this.onTouchMove = this.onTouchMove.bind(this);
		this.onTouchEnd = this.onTouchEnd.bind(this);
		this.clear = this.clear.bind(this);
	}
	componentDidMount() {
		this.drawingContext = this.canvas.getContext("2d");
		const hue = ((this.props.id * 5) % 12) * 30;
		this.drawingContext.strokeStyle = `hsl(${hue}, 75%, 40%)`;
		this.drawingContext.lineWidth = 4;
		this.drawingContext.lineCap = "round";
		this.drawing = false;

		window.addEventListener("mousemove", this.onMouseMove);
		window.addEventListener("mouseup", this.onMouseUp);
		window.addEventListener("touchmove", this.onTouchMove);
		window.addEventListener("touchend", this.onTouchEnd);
	}
	componentWillUnmount() {
		window.removeEventListener("mousemove", this.onMouseMove);
		window.removeEventListener("mouseup", this.onMouseUp);
		window.removeEventListener("touchmove", this.onTouchMove);
		window.removeEventListener("touchend", this.onTouchEnd);
	}
	handleStart(point) {
		const rect = this.canvas.getBoundingClientRect();
		const x = point.clientX - rect.left;
		const y = point.clientY - rect.top;

		this.drawingContext.beginPath();
		this.drawingContext.moveTo(x, y);
		this.drawingContext.stroke();

		this.props.onChange(this.canvas.toDataURL());
	}
	handleMove(point) {
		const rect = this.canvas.getBoundingClientRect();
		const x = point.clientX - rect.left;
		const y = point.clientY - rect.top;

		this.drawingContext.lineTo(x, y);
		this.drawingContext.stroke();

		this.props.onChange(this.canvas.toDataURL());
	}
	handleEnd(point) {
		const rect = this.canvas.getBoundingClientRect();
		const x = point.clientX - rect.left;
		const y = point.clientY - rect.top;

		this.drawingContext.lineTo(x, y);
		this.drawingContext.stroke();
		this.drawingContext.closePath();

		this.props.onChange(this.canvas.toDataURL());
	}
	onMouseDown(event) {
		if (event.button === 0) {
			event.preventDefault();
			this.drawing = true;
			this.handleStart(event);
		}
	}
	onMouseMove(event) {
		if (this.drawing) {
			this.handleMove(event);
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
	onTouchStart(event) {
		if (this.touchIdentifier == null) {
			const touch = event.changedTouches[0];
			this.touchIdentifier = touch.identifier;
			this.handleStart(touch);
		}
	}
	onTouchMove(event) {
		if (this.touchIdentifier != null) {
			const touch = Array.from(event.changedTouches).find(
				(t) => t.identifier === this.touchIdentifier,
			);

			if (touch) {
				this.handleMove(touch);
			}
		}
	}
	onTouchEnd(event) {
		if (this.touchIdentifier != null) {
			const touch = Array.from(event.changedTouches).find(
				(t) => t.identifier === this.touchIdentifier,
			);

			if (touch) {
				this.touchIdentifier = null;
				this.handleEnd(touch);
			}
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
				className: styles.doodle,
				onMouseDown: this.onMouseDown,
				onTouchStart: this.onTouchStart,
				height: 200,
				width: 200,
				ref: (ref) => this.canvas = ref,
			}}),
			j({br: 0}),
			j({button: {onClick: this.clear}}, ["clear"]),
		]);
	}
}

Doodle.propTypes = {
	id: PropTypes.number.isRequired,
	onChange: PropTypes.func.isRequired,
};

module.exports = Doodle;
